import os
import time
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
from langchain_community.embeddings import SentenceTransformerEmbeddings

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ledger") 

def main():
    """
    Connects to Pinecone and creates a new serverless index if it doesn't already exist.
    """
    if not PINECONE_API_KEY or not PINECONE_ENVIRONMENT:
        print("🔴 Error: PINECONE_API_KEY and PINECONE_ENVIRONMENT must be set in your .env file.")
        return

    print("Initializing Pinecone client...")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # --- Check if Index Exists ---
    if INDEX_NAME in pc.list_indexes().names():
        print(f"✅ Index '{INDEX_NAME}' already exists. No action needed.")
        return

    # --- Get Vector Dimensions ---
    # It's crucial that the index dimension matches the dimension of the embedding model.
    # The 'all-MiniLM-L6-v2' model has a dimension of 384.
    print("Loading embedding model to determine vector dimensions...")
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    # We create a dummy embedding to get the dimension
    dummy_embedding = embeddings.embed_query("get model dimension")
    dimension = len(dummy_embedding)
    print(f"Model 'all-MiniLM-L6-v2' has a dimension of: {dimension}")


    # --- Create Index ---
    print(f"Creating a new serverless index named '{INDEX_NAME}'...")
    try:
        pc.create_index(
            name=INDEX_NAME,
            dimension=dimension,
            metric="cosine",  # 'cosine' is great for semantic similarity
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1" # Choose a region that works for you
            )
        )
        # Wait for the index to be ready
        print("Waiting for index to be initialized...")
        while not pc.describe_index(INDEX_NAME).status['ready']:
            time.sleep(1)
        
        print(f"✅ Index '{INDEX_NAME}' created successfully and is ready.")

    except Exception as e:
        print(f"🔴 Error creating index: {e}")

if __name__ == "__main__":
    main()