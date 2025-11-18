from fastapi import FastAPI
from routers.upload_router import router as upload_router
from routers.chat_router import router as chat_router

app = FastAPI(title="Legal Document Analysis API")

app.include_router(upload_router)
app.include_router(chat_router)

@app.get("/")
async def root():
    return {
        "message": "Legal Document Chatbot API",
        "endpoints": {
            "/upload-pdfs/": "POST - Upload 2-3 PDF files",
            "/chat/": "POST - Chat with documents + internet knowledge",
            "/health": "GET - Health check"
        }
    }

@app.get("/health")
async def health():
    from core.vector_store import vector_store
    return {
        "status": "healthy",
        "documents_loaded": vector_store is not None,
        "using": "LangChain + FAISS"
    }
