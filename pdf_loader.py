from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
import tempfile
import os

def load_and_split_pdfs(pdf_files):
    all_documents = []

    for filename, content in pdf_files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            loader = PyPDFLoader(tmp_path)
            documents = loader.load()

            for doc in documents:
                doc.metadata['source'] = filename

            all_documents.extend(documents)

        finally:
            os.unlink(tmp_path)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        length_function=len
    )

    chunks = text_splitter.split_documents(all_documents)
    return chunks
