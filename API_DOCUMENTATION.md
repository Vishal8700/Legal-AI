# Justitia.ai API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Root Endpoint
Get API information and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "Legal Document Chatbot API",
  "endpoints": {
    "/upload-pdfs/": "POST - Upload 2-3 PDF files",
    "/chat/": "POST - Chat with documents + internet knowledge",
    "/health": "GET - Health check"
  }
}
```

---

### 2. Upload PDFs
Upload 2-3 PDF files for analysis using RAG (Retrieval Augmented Generation).

**Endpoint:** `POST /upload-pdfs/`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `files`: Array of 2-3 PDF files

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('files', pdfFile1);
formData.append('files', pdfFile2);
formData.append('files', pdfFile3); // optional

const response = await fetch('http://localhost:8000/upload-pdfs/', {
  method: 'POST',
  body: formData
});
```

**Success Response (200):**
```json
{
  "message": "PDFs processed successfully with LangChain",
  "total_chunks": 150,
  "files_processed": ["contract1.pdf", "agreement2.pdf"]
}
```

**Error Response (400):**
```json
{
  "detail": "Please upload 2-3 PDF files"
}
```

**Error Response (400):**
```json
{
  "detail": "filename.txt is not a PDF file"
}
```

---

### 3. Chat
Send a message and get AI-powered response. Can use uploaded documents or general knowledge.

**Endpoint:** `POST /chat/`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "question": "What are the key terms in this contract?",
  "use_documents": true
}
```

**Parameters:**
- `question` (string, required): The user's question or message
- `use_documents` (boolean, optional, default: true): 
  - `true`: Use uploaded documents + general knowledge
  - `false`: Use only general knowledge (internet)

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:8000/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: "What is the termination clause?",
    use_documents: true
  })
});
```

**Success Response (200):**
```json
{
  "answer": "Based on the documents, the termination clause states...",
  "source": "documents and internet"
}
```

**Possible source values:**
- `"documents and internet"`: Answer uses both uploaded docs and general knowledge
- `"documents only"`: Answer uses only uploaded documents
- `"internet"`: Answer uses only general knowledge (no docs uploaded or use_documents=false)

**Error Response (500):**
```json
{
  "detail": "LLM API error: [error details]"
}
```

---

### 4. Health Check
Check if the API is running and if documents are loaded.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "documents_loaded": true,
  "using": "LangChain + FAISS"
}
```

**Parameters:**
- `status`: API health status
- `documents_loaded`: Whether PDFs have been uploaded and processed
- `using`: Technology stack being used

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Technology Stack

### Backend
- **FastAPI**: Web framework
- **LangChain**: Document processing and RAG pipeline
- **FAISS**: Vector similarity search
- **HuggingFace Embeddings**: Text to vector conversion (all-MiniLM-L6-v2)
- **OpenRouter**: LLM API (Google Gemma model)
- **PyPDF**: PDF text extraction

### Processing Pipeline
1. PDFs uploaded via `/upload-pdfs/`
2. Text extracted using PyPDFLoader
3. Text split into chunks (1000 chars, 150 overlap)
4. Chunks converted to embeddings
5. Embeddings stored in FAISS vector store
6. On chat query:
   - Query converted to embedding
   - Similar chunks retrieved from FAISS
   - Context + query sent to LLM
   - LLM generates response

---

## Usage Examples

### Python
```python
import requests

# Upload PDFs
files = [
    ('files', open('contract1.pdf', 'rb')),
    ('files', open('contract2.pdf', 'rb'))
]
response = requests.post('http://localhost:8000/upload-pdfs/', files=files)
print(response.json())

# Chat with documents
response = requests.post('http://localhost:8000/chat/', 
    json={
        "question": "What are the payment terms?",
        "use_documents": True
    })
print(response.json())

# Chat without documents (general knowledge)
response = requests.post('http://localhost:8000/chat/', 
    json={
        "question": "What is a force majeure clause?",
        "use_documents": False
    })
print(response.json())

# Health check
response = requests.get('http://localhost:8000/health')
print(response.json())
```

### JavaScript/TypeScript
```typescript
// Upload PDFs
const uploadPDFs = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const response = await fetch('http://localhost:8000/upload-pdfs/', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// Chat
const chat = async (question: string, useDocuments: boolean = true) => {
  const response = await fetch('http://localhost:8000/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, use_documents: useDocuments })
  });
  
  return await response.json();
};

// Health check
const checkHealth = async () => {
  const response = await fetch('http://localhost:8000/health');
  return await response.json();
};
```

### cURL
```bash
# Upload PDFs
curl -X POST "http://localhost:8000/upload-pdfs/" \
  -F "files=@contract1.pdf" \
  -F "files=@contract2.pdf"

# Chat with documents
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key terms?", "use_documents": true}'

# Health check
curl "http://localhost:8000/health"
```

---

## Rate Limits & Considerations

- No built-in rate limiting (consider adding for production)
- OpenRouter API has its own rate limits
- Large PDFs may take time to process
- Vector store is stored in memory (resets on server restart)
- Consider adding persistent storage for production use

---

## Security Notes

- API key stored securely in backend .env file
- CORS enabled for all origins (restrict in production)
- No authentication implemented (add for production)
- File uploads not validated for malicious content
- Consider adding file size limits
- Add request validation and sanitization for production

---

## Future Enhancements

Potential improvements:
- [ ] Add authentication (JWT, OAuth)
- [ ] Persistent vector store (save to disk)
- [ ] Document management (list, delete docs)
- [ ] Streaming responses
- [ ] Rate limiting
- [ ] Request logging
- [ ] Metrics and monitoring
- [ ] Support for more file types
- [ ] Multi-user support with isolated document stores
- [ ] Chat history persistence
