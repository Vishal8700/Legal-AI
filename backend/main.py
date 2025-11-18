from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import json
import requests
import re
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
import tempfile

# Load environment variables
load_dotenv()

app = FastAPI(title="Legal Document Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize embeddings
embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# Global storage - stores document context per session
document_contexts = {}

class ChatRequest(BaseModel):
    question: str
    use_documents: bool = True
    session_id: str = "default"
    document_texts: List[str] = []

def load_and_split_pdfs(pdf_files: List[tuple]) -> List[Document]:
    """Load PDFs and split into chunks using LangChain"""
    all_documents = []
    
    for filename, content in pdf_files:
        # Save to temp file for PyPDFLoader
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            loader = PyPDFLoader(tmp_path)
            documents = loader.load()
            
            # Add source metadata
            for doc in documents:
                doc.metadata['source'] = filename
            
            all_documents.extend(documents)
        finally:
            os.unlink(tmp_path)
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        length_function=len
    )
    
    chunks = text_splitter.split_documents(all_documents)
    return chunks

def build_vector_store(documents: List[Document]):
    """Build FAISS vector store using LangChain"""
    global vector_store
    vector_store = FAISS.from_documents(documents, embeddings)
    return vector_store

def retrieve_relevant_docs(query: str, top_k: int = 5) -> List[Document]:
    """Retrieve relevant documents using LangChain FAISS"""
    if vector_store is None:
        return []
    
    docs = vector_store.similarity_search(query, k=top_k)
    return docs



@app.post("/upload-pdfs/")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """Upload 1-3 PDF files for analysis using LangChain"""
    if len(files) == 0 or len(files) > 3:
        raise HTTPException(status_code=400, detail="Please upload 1-3 PDF files")
    
    pdf_files = []
    for file in files:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF file")
        
        content = await file.read()
        pdf_files.append((file.filename, content))
    
    # Load and split PDFs using LangChain
    documents = load_and_split_pdfs(pdf_files)
    
    # Build FAISS vector store
    build_vector_store(documents)
    
    return {
        "message": "PDFs processed successfully with LangChain",
        "total_chunks": len(documents),
        "files_processed": [f[0] for f in pdf_files]
    }

@app.get("/")
async def root():
    return {
        "message": "Legal Document Chatbot API",
        "endpoints": {
            "/upload-pdfs/": "POST - Upload 1-3 PDF files",
            "/chat/": "POST - Chat with documents + internet knowledge",
            "/health": "GET - Health check"
        }
    }

@app.post("/chat/")
async def chat(request: ChatRequest):
    """Chat endpoint - answers from documents + internet knowledge"""
    
    try:
        # Store document texts in session if provided
        if request.document_texts and len(request.document_texts) > 0:
            print(f"Storing {len(request.document_texts)} documents for session {request.session_id}")
            document_contexts[request.session_id] = request.document_texts
        
        # Check if session has documents
        has_documents = request.session_id in document_contexts and len(document_contexts[request.session_id]) > 0
        print(f"Session {request.session_id} has documents: {has_documents}")
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing request: {str(e)}")
    
    # If documents exist and user wants to use them
    if request.use_documents and has_documents:
        # Get stored document texts (limit to prevent token overflow)
        doc_texts = []
        for idx, text in enumerate(document_contexts[request.session_id]):
            # Limit each document to 8000 characters to prevent token issues
            truncated_text = text[:8000] if len(text) > 8000 else text
            doc_texts.append(f"--- Document {idx + 1} ---\n{truncated_text}")
        
        context_text = "\n\n".join(doc_texts)
        
        prompt = f"""You are Justitia.ai, an expert legal AI assistant specializing in Indian judiciary laws. Answer the user's question using both the provided document context and your general knowledge.

DOCUMENT CONTEXT:
{context_text}

USER QUESTION: {request.question}

INSTRUCTIONS:
- Use information from the documents when relevant
- Supplement with your general knowledge when needed
- Be clear about what comes from documents vs general knowledge
- Give a direct, helpful answer
- Focus on Indian legal context when applicable
- Format your response with clear sections and bullet points
- Use proper line breaks for readability
- Avoid excessive markdown formatting

Return JSON:
{{
  "answer": "your comprehensive answer with proper formatting",
  "source": "documents and internet" or "documents only" or "internet only"
}}"""
    else:
        # No documents or user doesn't want to use them
        prompt = f"""You are Justitia.ai, an expert legal AI assistant specializing in Indian judiciary laws. Answer the user's question using your general knowledge.

USER QUESTION: {request.question}

INSTRUCTIONS:
- Provide accurate, helpful information
- Be concise and clear
- Use your general knowledge
- Focus on Indian legal context when applicable
- Format your response with clear sections and bullet points
- Use proper line breaks for readability
- Avoid excessive markdown formatting

Return JSON:
{{
  "answer": "your answer with proper formatting",
  "source": "internet"
}}"""
    
    response = requests.post(
        url=OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Legal Document Analysis API"
        },
        json={
            "model": "nvidia/nemotron-nano-12b-v2-vl:free",
            "messages": [
                {
                    "role": "system",
                    "content": """You are Justitia.ai, an expert legal AI assistant specializing in Indian judiciary laws. Your expertise covers:
- Indian Contract Act, 1872
- Indian Evidence Act, 1872
- Code of Civil Procedure, 1908
- Indian Constitution
- Consumer Protection Act, 2019
- Arbitration and Conciliation Act, 1996
- Indian Partnership Act, 1932
- Sale of Goods Act, 1930
- Negotiable Instruments Act, 1881
- Transfer of Property Act, 1882

Provide clear, professional legal advice and analysis."""
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "extra_body": {
                "reasoning": {
                    "enabled": True
                }
            }
        }
    )
    
    if response.status_code != 200:
        error_detail = f"LLM API error: {response.status_code}"
        try:
            error_data = response.json()
            if "error" in error_data:
                error_detail = f"LLM API error: {error_data['error']}"
        except:
            error_detail = f"LLM API error: {response.text[:200]}"
        raise HTTPException(status_code=500, detail=error_detail)
    
    try:
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Clean markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        # Clean up markdown formatting for better readability
        # Remove bold formatting (**text**)
        content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)
        # Remove italic formatting (*text*)
        content = re.sub(r'\*([^*]+)\*', r'\1', content)
        # Convert markdown headers to plain text with proper spacing
        content = re.sub(r'###\s+', '\n', content)
        content = re.sub(r'##\s+', '\n', content)
        content = re.sub(r'#\s+', '\n', content)
        # Clean up multiple newlines
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {
                "answer": content,
                "source": "documents and internet" if (request.use_documents and has_documents) else "internet"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing LLM response: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "documents_loaded": vector_store is not None,
        "using": "LangChain + FAISS"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
