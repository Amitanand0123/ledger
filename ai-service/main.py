import os
import json
import re
import shutil
import asyncio
import tempfile
import subprocess
from fastapi import FastAPI, HTTPException, Security
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from google import genai

load_dotenv()

# --- Configuration ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")

if not GOOGLE_API_KEY or not AI_SERVICE_API_KEY:
    raise ValueError("Missing required environment variables: GOOGLE_API_KEY and AI_SERVICE_API_KEY")

client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL = "gemini-2.5-flash"

app = FastAPI(title="JobTracker AI Service")
security = HTTPBearer()


# --- Auth ---
def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.scheme != "Bearer" or credentials.credentials != AI_SERVICE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return True


# --- Pydantic Models ---
class EmbedJobRequest(BaseModel):
    job_id: str
    user_id: str
    job_description: str

class FindSimilarRequest(BaseModel):
    job_id: str
    job_description: str
    user_id: str = ""

class SimilarJob(BaseModel):
    id: str
    description: str
    score: float

class AnalyzeResumeRequest(BaseModel):
    resume_text: str

class MatchResumeRequest(BaseModel):
    resume_analysis: dict
    job_description_text: str

class MatchResponse(BaseModel):
    match_score: float = Field(description="Match percentage between 0-100")
    matching_skills: List[str] = Field(description="Skills that match the job requirements")
    missing_skills: List[str] = Field(description="Skills required by job but missing from resume")
    suggestions: str = Field(description="Actionable suggestions to improve match")

class RebuildLatexRequest(BaseModel):
    latex_source: str
    job_description: str

class CompileLatexRequest(BaseModel):
    latex_source: str

class AgentRequest(BaseModel):
    user_id: str
    resume_text: str
    job_description: str
    user_goal: str


# --- Gemini Helper ---
async def call_gemini(prompt: str, expect_json: bool = False) -> str | dict:
    """Call Gemini and optionally parse the response as JSON."""
    text = ""
    try:
        config = {"temperature": 0.4}
        if expect_json:
            config["response_mime_type"] = "application/json"

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=config,
        ))

        text = response.text

        if expect_json:
            return json.loads(text)
        return text
    except json.JSONDecodeError:
        # Fallback: try to extract JSON from markdown code blocks
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception:
        raise HTTPException(status_code=500, detail="AI service encountered an internal error.")


# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/embed-job")
async def embed_job(request: EmbedJobRequest, authorized: bool = Security(verify_api_key)):
    """No-op: Vector DB removed. Returns success for backward compatibility."""
    return {"message": "Job processed successfully", "job_id": request.job_id}


@app.post("/find-similar-jobs", response_model=List[SimilarJob])
async def find_similar_jobs(request: FindSimilarRequest, authorized: bool = Security(verify_api_key)):
    """Returns empty list. Vector-based similarity search has been removed."""
    return []


@app.post("/analyze-resume")
async def analyze_resume(request: AnalyzeResumeRequest, authorized: bool = Security(verify_api_key)):
    """Analyzes a resume and extracts structured information (skills and summary)."""
    prompt = f"""You are an expert HR analyst. Analyze the following resume text.

Extract:
1. "skills": A list of the top 5-7 most relevant skills, technologies, or qualifications found in the resume.
2. "summary": A concise 2-3 sentence professional summary of the candidate based on the resume.

**NO-HALLUCINATION RULE:** Only extract skills and information that are explicitly stated in the resume text. Do NOT infer, assume, or fabricate any skills, qualifications, or experiences that are not clearly present. If the resume is vague, reflect that vagueness rather than filling gaps with assumptions.

Resume:
{request.resume_text}

Return a JSON object with exactly these two keys: "skills" (array of strings) and "summary" (string)."""

    result = await call_gemini(prompt, expect_json=True)

    return {
        "skills": result.get("skills", []),
        "summary": result.get("summary", ""),
    }


@app.post("/match-resume-to-job")
async def match_resume_to_job(request: MatchResumeRequest, authorized: bool = Security(verify_api_key)):
    """Matches a resume against a job description and provides detailed analysis."""
    skills = request.resume_analysis.get("skills", [])
    summary = request.resume_analysis.get("summary", "")

    prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer.
Compare the resume against the job description.

Resume Analysis:
- Skills: {skills}
- Summary: {summary}

Job Description:
---
{request.job_description_text}
---

**NO-HALLUCINATION RULE:**
- "matching_skills" must ONLY contain skills that are explicitly present in BOTH the resume AND the job description. Do not assume or infer skills.
- "missing_skills" must ONLY contain skills explicitly required in the job description that are clearly absent from the resume.
- "suggestions" must be based solely on the actual gap between the resume and job description. Do not invent credentials or experiences the candidate should claim to have.
- Be honest about the match score. Do not inflate it to be encouraging — accuracy matters more.

Analyze the match and return a JSON object with exactly these keys:
- "match_score": A number between 0 and 100 indicating how well the resume matches the job
- "matching_skills": Array of skills from the resume that match the job requirements
- "missing_skills": Array of important skills mentioned in the job but missing from the resume
- "suggestions": A string with specific, actionable recommendations to improve the match (2-3 sentences)"""

    result = await call_gemini(prompt, expect_json=True)

    return {
        "match_score": result.get("match_score", 0),
        "matching_skills": result.get("matching_skills", []),
        "missing_skills": result.get("missing_skills", []),
        "suggestions": result.get("suggestions", ""),
    }


@app.post("/rebuild-resume-latex")
async def rebuild_resume_latex(request: RebuildLatexRequest, authorized: bool = Security(verify_api_key)):
    """Uses Gemini to modify LaTeX resume content based on a job description."""
    prompt = f"""You are an expert resume writer who is fluent in LaTeX.
Your task is to rewrite the content of the provided LaTeX resume to be perfectly tailored for the given job description.

**CRITICAL INSTRUCTIONS:**
1. **DO NOT** change the LaTeX structure, commands, formatting, document class, or layout. Preserve it exactly.
2. **ONLY** modify the text content within the resume, such as project descriptions, experience bullet points, and the professional summary.
3. Incorporate keywords from the job description naturally into the text.
4. Rewrite bullet points to highlight accomplishments and skills that are most relevant to the job description.
5. Your output **MUST** be only the raw, complete, modified LaTeX code. Do not add any explanations, apologies, or introductory text.

**NO-HALLUCINATION RULE:**
- You may ONLY use information that exists in the original resume. Do NOT invent new projects, jobs, certifications, metrics, or achievements.
- You may rephrase and reorder existing content to better match the job description, but you must not fabricate new content.
- If the resume says "improved performance", do NOT invent a specific percentage like "improved performance by 40%". Only use metrics that are explicitly in the original resume.
- Keyword incorporation must be honest — add relevant keywords where the candidate genuinely has that skill based on their experience, not where they don't.

**Job Description:**
---
{request.job_description}
---

**Original LaTeX Resume Source:**
---
{request.latex_source}
---"""

    modified_latex = await call_gemini(prompt, expect_json=False)

    # Strip markdown code fences if Gemini wraps the output
    if modified_latex.startswith("```"):
        lines = modified_latex.split("\n")
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        else:
            lines = lines[1:]
        modified_latex = "\n".join(lines)

    return {"modified_latex": modified_latex}


@app.post("/compile-latex-to-pdf")
async def compile_latex_to_pdf(request: CompileLatexRequest, authorized: bool = Security(verify_api_key)):
    """Compiles LaTeX code into a PDF using pdflatex."""
    # Use manual temp directory so it persists until FileResponse finishes streaming
    tempdir = tempfile.mkdtemp()
    try:
        tex_path = os.path.join(tempdir, "resume.tex")
        pdf_path = os.path.join(tempdir, "resume.pdf")

        with open(tex_path, "w") as f:
            f.write(request.latex_source)

        # Run pdflatex twice for proper cross-references
        # -no-shell-escape prevents \write18 command injection
        for _ in range(2):
            process = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-no-shell-escape", "-output-directory", tempdir, tex_path],
                capture_output=True,
                text=True,
                timeout=30,
            )

        if process.returncode != 0:
            shutil.rmtree(tempdir, ignore_errors=True)
            raise HTTPException(
                status_code=500,
                detail="LaTeX compilation failed. Please check your LaTeX source.",
            )

        if not os.path.exists(pdf_path):
            shutil.rmtree(tempdir, ignore_errors=True)
            raise HTTPException(status_code=500, detail="PDF file was not generated.")

        # Use BackgroundTask to clean up tempdir AFTER the response is streamed
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename="generated_resume.pdf",
            background=BackgroundTask(shutil.rmtree, tempdir, ignore_errors=True),
        )
    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        shutil.rmtree(tempdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="LaTeX compilation timed out.")
    except Exception:
        shutil.rmtree(tempdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="An error occurred during PDF compilation.")


@app.post("/agent/invoke")
async def invoke_agent(request: AgentRequest, authorized: bool = Security(verify_api_key)):
    """Provides career advice by analyzing resume against job description."""
    prompt = f"""You are a world-class career coach providing advice in a job tracking application.

A user wants to achieve this goal: "{request.user_goal}"

Here is their resume:
---
{request.resume_text}
---

Here is the target job description they want to apply for:
---
{request.job_description}
---

Please perform the following analysis and provide a comprehensive recommendation:

1. First, identify the candidate's key skills and professional profile from the resume.
2. Then, compare those skills against the job requirements.
3. Finally, provide a concise, actionable, step-by-step recommendation in Markdown format.

Focus on:
- Which of their existing skills to emphasize for this specific role
- Gaps between their profile and the job requirements
- Specific, actionable steps to improve their candidacy
- How to tailor their resume for this position

**NO-HALLUCINATION RULE:** Base your analysis ONLY on information present in the resume and job description. Do not assume the candidate has skills, experiences, or qualifications not mentioned in their resume. When suggesting improvements, be clear about what the candidate would need to *learn or acquire* versus what they already have.

Keep the tone encouraging and professional."""

    recommendation = await call_gemini(prompt, expect_json=False)

    return {"recommendation": recommendation}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
