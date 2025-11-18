from fastapi import APIRouter, UploadFile, File, HTTPException
from core.pdf_loader import load_and_split_pdfs
from core.vector_store import build_vector_store

router = APIRouter()

@router.post("/upload-pdfs/")
async def upload_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2 or len(files) > 3:
        raise HTTPException(status_code=400, detail="Please upload 2-3 PDF files")

    pdf_files = []
    for f in files:
        if not f.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{f.filename} is not a PDF file")

        content = await f.read()
        pdf_files.append((f.filename, content))

    documents = load_and_split_pdfs(pdf_files)
    build_vector_store(documents)

    return {
        "message": "PDFs processed successfully with LangChain",
        "total_chunks": len(documents),
        "files_processed": [f[0] for f in pdf_files]
    }
