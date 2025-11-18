# Legal Document Analysis API

FastAPI server for analyzing legal documents using RAG (Retrieval Augmented Generation) with FAISS vector store and LLM.

## Features

- Upload 2-3 PDF documents
- Text extraction from PDFs
- Chunking with 1000 chars + 150 overlap
- Sentence embeddings using SentenceTransformers
- FAISS vector store for efficient retrieval
- LLM-based analysis with OpenAI
- JSON responses with:
  - Summary
  - Clause explanations
  - Identified flaws
  - Query answers
  - Relevant sections

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set OpenRouter API key in `.env`:
```
OPENROUTER_API_KEY=your_api_key_here
```

3. Run the server:
```bash
python main.py
```

Server runs on http://localhost:8000

## Tech Stack

- **LangChain**: Document loading, text splitting, vector store management
- **FAISS**: Vector similarity search
- **HuggingFace Embeddings**: Text to vector conversion
- **OpenRouter**: LLM API (Mistral free model)
- **FastAPI**: REST API server

## API Endpoints

### POST /upload-pdfs/
Upload 2-3 PDF files for analysis
- Body: multipart/form-data with PDF files
- Returns: Processing confirmation with chunk count

### POST /chat/
Chat with documents + internet knowledge
- Body: `{"question": "your question", "use_documents": true}`
- `use_documents: true` - Uses uploaded docs + general knowledge
- `use_documents: false` - Uses only general knowledge (internet)
- Returns: JSON with answer and source

### GET /health
Check API status and document load status

## Usage Example

```python
import requests

# 1. Upload PDFs (optional)
files = [
    ('files', open('doc1.pdf', 'rb')),
    ('files', open('doc2.pdf', 'rb'))
]
requests.post('http://localhost:8000/upload-pdfs/', files=files)

# 2. Chat with documents
response = requests.post('http://localhost:8000/chat/', 
    json={"question": "Who signed this document?", "use_documents": True})
print(response.json())

# 3. Chat without documents (general knowledge)
response = requests.post('http://localhost:8000/chat/', 
    json={"question": "What is a contract?", "use_documents": False})
print(response.json())
```

## Testing

Run the unified chatbot test:
```bash
python test_chatbot.py
```
