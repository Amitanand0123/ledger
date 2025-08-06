import os
import tempfile
import subprocess
from fastapi import FastAPI, HTTPException, Security
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

# --- Configuration & Models ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ledger") 

if not PINECONE_API_KEY or not AI_SERVICE_API_KEY or not INDEX_NAME:
    raise ValueError("Missing critical environment variables: PINECONE_API_KEY, AI_SERVICE_API_KEY, INDEX_NAME")

app = FastAPI(title="JobTracker Advanced AI Agent")
security = HTTPBearer()

# Models
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2") # Runs locally, fast!
vectorstore = PineconeVectorStore(index_name=INDEX_NAME, embedding=embeddings)

# --- Security ---
def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.scheme != "Bearer" or credentials.credentials != AI_SERVICE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return True

# --- Pydantic Models for API and LangChain Parsing ---

# --- NEW: Pydantic model for structured resume analysis ---
class ResumeAnalysis(BaseModel):
    skills: List[str] = Field(description="A list of the top 5-7 most relevant skills, technologies, or qualifications found in the resume.")
    summary: str = Field(description="A concise 2-3 sentence professional summary of the candidate based on the resume.")

# --- MODIFIED: Added user_id for multi-tenancy ---
class EmbedJobRequest(BaseModel):
    job_id: str
    user_id: str # To associate the vector with a user
    job_description: str

# --- MODIFIED: Added user_id for multi-tenancy ---
class AgentRequest(BaseModel):
    user_id: str
    resume_text: str
    job_description: str
    user_goal: str

# --- LangGraph State & Nodes ---
class AgentState(TypedDict):
    request: AgentRequest
    resume_analysis: ResumeAnalysis # --- MODIFIED: Use the structured Pydantic model
    similar_jobs: List[str]
    final_recommendation: str

class FindSimilarRequest(BaseModel):
    job_id: str
    user_id: str
    job_description: str

class SimilarJob(BaseModel):
    id: str
    description: str
    score: float

class RebuildLatexRequest(BaseModel):
    latex_source: str
    job_description: str

class CompileLatexRequest(BaseModel):
    latex_source: str

# --- NEW: Un-mocked resume analysis node ---
def analyze_resume_node(state: AgentState):
    """Node to analyze the initial resume and extract structured data."""
    print("--- 1. Analyzing Resume ---")
    parser = JsonOutputParser(pydantic_object=ResumeAnalysis)
    
    prompt = PromptTemplate(
        template="You are an expert HR analyst. Analyze the following resume text.\n{format_instructions}\nResume:\n{resume}",
        input_variables=["resume"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    
    chain = prompt | llm | parser
    analysis_result = chain.invoke({"resume": state['request'].resume_text})
    
    state['resume_analysis'] = analysis_result
    return state

# --- MODIFIED: Added user_id filtering ---
def find_similar_jobs_node(state: AgentState):
    """Node to find similar jobs from Pinecone to provide context, scoped to the user."""
    print("--- 2. Finding Similar Jobs ---")
    req = state['request']
    
    # Use the user_id from the request to filter the search
    similar_docs = vectorstore.similarity_search(
        req.job_description,
        k=3,
        filter={"user_id": req.user_id} # CRITICAL: Multi-tenancy filter
    )
    state['similar_jobs'] = [doc.page_content for doc in similar_docs]
    return state

# --- MODIFIED: Improved prompt ---
def generate_recommendation_node(state: AgentState):
    """Final node to generate the tailored advice."""
    print("--- 3. Generating Final Recommendation ---")
    prompt = PromptTemplate.from_template("""You are a world-class career coach providing advice in a job tracking app.
    A user wants to achieve this goal: "{user_goal}"

    Here is the structured analysis of their resume:
    - Key Skills Identified: {skills}
    - Professional Summary: {summary}
    
    Here is the target job description they want to apply for:
    ---
    {job_description}
    ---

    For added context, here are snippets from other similar jobs they have stored:
    ---
    {similar_jobs}
    ---

    Provide a concise, actionable, and step-by-step recommendation in Markdown format.
    Focus on specific changes to their resume, highlighting which of their skills ({skills}) to emphasize,
    and suggest how to bridge any gaps based on the target job description.
    Keep the tone encouraging and professional.
    """)
    
    chain = prompt | llm | StrOutputParser()
    
    response = chain.invoke({
        "user_goal": state['request'].user_goal,
        "skills": state['resume_analysis']['skills'],
        "summary": state['resume_analysis']['summary'],
        "job_description": state['request'].job_description,
        "similar_jobs": "\n---\n".join(state['similar_jobs']) if state['similar_jobs'] else "None"
    })
    
    state['final_recommendation'] = response
    return state
    
# --- Define the Graph ---
workflow = StateGraph(AgentState)
workflow.add_node("analyze_resume", analyze_resume_node)
workflow.add_node("find_similar_jobs", find_similar_jobs_node)
workflow.add_node("generate_recommendation", generate_recommendation_node)

workflow.set_entry_point("analyze_resume")
workflow.add_edge("analyze_resume", "find_similar_jobs")
workflow.add_edge("find_similar_jobs", "generate_recommendation")
workflow.add_edge("generate_recommendation", END)

agent_app = workflow.compile()

# --- API Endpoints ---

@app.post("/embed-job")
async def embed_job(request: EmbedJobRequest, authorized: bool = Security(verify_api_key)):
    """Converts a job description to a vector and stores it in Pinecone with user_id metadata."""
    vectorstore.add_texts(
        texts=[request.job_description],
        # --- MODIFIED: Add user_id to metadata ---
        metadatas=[{"job_id": request.job_id, "user_id": request.user_id}],
        ids=[request.job_id] # Use job_id as the unique vector ID
    )
    return {"message": "Job embedded successfully", "job_id": request.job_id}

@app.post("/agent/invoke")
async def invoke_agent(request: AgentRequest, authorized: bool = Security(verify_api_key)):
    """Invokes the full LangGraph agent to get career advice."""
    inputs = {"request": request}
    # The result will be the final state of the graph
    result = agent_app.invoke(inputs)
    return {"recommendation": result.get("final_recommendation")}

@app.get("/health")
def health_check(): return {"status": "ok"}

@app.post("/find-similar-jobs", response_model=List[SimilarJob])
async def find_similar_jobs(request: FindSimilarRequest, authorized: bool = Security(verify_api_key)):
    """Finds jobs semantically similar to the provided description, scoped to the user."""
    try:
        similar_docs = vectorstore.similarity_search_with_score(
            query=request.job_description,
            k=5, # Find top 5 similar items
            filter={"user_id": request.user_id} # CRITICAL: Ensure multi-tenancy
        )
        
        results = []
        for doc, score in similar_docs:
            # Exclude the job itself from the results
            if doc.metadata and doc.metadata.get("job_id") != request.job_id:
                results.append(SimilarJob(
                    id=doc.metadata.get("job_id"),
                    description=doc.page_content,
                    score=score
                ))
        # Return up to 3 results after filtering
        return results[:3]
    except Exception as e:
        print(f"Error finding similar jobs: {e}")
        raise HTTPException(status_code=500, detail="Could not perform similarity search.")
    

@app.post("/rebuild-resume-latex")
async def rebuild_resume_latex(request: RebuildLatexRequest, authorized: bool = Security(verify_api_key)):
    """Uses an LLM to modify LaTeX resume content based on a job description."""
    prompt = PromptTemplate.from_template("""You are an expert resume writer who is fluent in LaTeX.
Your task is to rewrite the content of the provided LaTeX resume to be perfectly tailored for the given job description.

**CRITICAL INSTRUCTIONS:**
1.  **DO NOT** change the LaTeX structure, commands, formatting, document class, or layout. Preserve it exactly.
2.  **ONLY** modify the text content within the resume, such as project descriptions, experience bullet points, and the professional summary.
3.  Incorporate keywords from the job description naturally into the text.
4.  Rewrite bullet points to highlight accomplishments and skills that are most relevant to the job description.
5.  Your output **MUST** be only the raw, complete, modified LaTeX code. Do not add any explanations, apologies, or introductory text.

**Job Description:**
---
{job_description}
---

**Original LaTeX Resume Source:**
---
{latex_source}
---
    """)
    
    chain = prompt | llm | StrOutputParser()
    modified_latex = chain.invoke({
        "job_description": request.job_description,
        "latex_source": request.latex_source
    })
    
    return {"modified_latex": modified_latex}

@app.post("/compile-latex-to-pdf")
async def compile_latex_to_pdf(request: CompileLatexRequest, authorized: bool = Security(verify_api_key)):
    """
    Compiles a string of LaTeX code into a PDF file using pdflatex.
    Requires a TeX Live distribution to be installed in the execution environment.
    """
    with tempfile.TemporaryDirectory() as tempdir:
        tex_path = os.path.join(tempdir, "resume.tex")
        pdf_path = os.path.join(tempdir, "resume.pdf")
        
        with open(tex_path, "w") as f:
            f.write(request.latex_source)
            
        # Run pdflatex command. The -interaction=nonstopmode flag prevents it from pausing on errors.
        # Running it twice is often necessary to resolve references correctly.
        process = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "-output-directory", tempdir, tex_path],
            capture_output=True, text=True
        )
        process = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "-output-directory", tempdir, tex_path],
            capture_output=True, text=True
        )

        if process.returncode != 0:
            # If compilation fails, return the log for debugging
            raise HTTPException(status_code=500, detail=f"LaTeX compilation failed: {process.stdout} {process.stderr}")

        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="PDF file was not generated after successful compilation.")

        return FileResponse(pdf_path, media_type='application/pdf', filename="generated_resume.pdf")