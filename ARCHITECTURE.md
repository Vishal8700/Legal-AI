# System Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         React Frontend (Port 5173)                  │    │
│  │                                                     │    │
│  │  • Chat Interface (Chat.tsx)                       │    │
│  │  • File Upload UI                                  │    │
│  │  • Voice Input                                     │    │
│  │  • Message Display                                 │    │
│  │                                                     │    │
│  │  API Client (api.ts)                               │    │
│  │  └─> uploadPDFs()                                  │    │
│  │  └─> sendChatMessage()                             │    │
│  │  └─> checkHealth()                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ HTTP/REST                        │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────┐    │
│  │      FastAPI Backend (Port 8000)                    │    │
│  │                                                     │    │
│  │  Endpoints:                                         │    │
│  │  • POST /upload-pdfs/  ─────┐                      │    │
│  │  • POST /chat/         ─────┤                      │    │
│  │  • GET  /health        ─────┤                      │    │
│  │                              │                      │    │
│  └──────────────────────────────┼──────────────────────┘    │
│                                 │                            │
│  ┌──────────────────────────────▼──────────────────────┐   │
│  │         LangChain Pipeline                          │   │
│  │                                                     │   │
│  │  1. Document Loading (PyPDFLoader)                 │   │
│  │  2. Text Splitting (RecursiveCharacterTextSplitter)│   │
│  │  3. Embeddings (HuggingFace all-MiniLM-L6-v2)     │   │
│  │  4. Vector Store (FAISS)                           │   │
│  │  5. Similarity Search                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                 │                            │
│                                 │                            │
│  ┌──────────────────────────────▼──────────────────────┐   │
│  │         Vector Store (FAISS)                        │   │
│  │                                                     │   │
│  │  • Stores document embeddings                      │   │
│  │  • Performs similarity search                      │   │
│  │  • Returns relevant chunks                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                 │                            │
└─────────────────────────────────┼────────────────────────────┘
                                  │
                                  │ API Call
                                  ▼
                    ┌──────────────────────────┐
                    │   OpenRouter API         │
                    │                          │
                    │  Model: Google Gemma     │
                    │  (gemma-3n-e4b-it:free) │
                    └──────────────────────────┘
```

## Data Flow

### 1. Document Upload Flow

```
User selects PDFs
      │
      ▼
Frontend validates (2-3 files)
      │
      ▼
POST /upload-pdfs/ with FormData
      │
      ▼
Backend receives files
      │
      ▼
PyPDFLoader extracts text
      │
      ▼
RecursiveCharacterTextSplitter
(chunks: 1000 chars, overlap: 150)
      │
      ▼
HuggingFace creates embeddings
      │
      ▼
FAISS stores vectors
      │
      ▼
Response: {total_chunks, files_processed}
      │
      ▼
Frontend shows success message
```

### 2. Chat Flow (With Documents)

```
User types message
      │
      ▼
Frontend sends POST /chat/
{question, use_documents: true}
      │
      ▼
Backend receives request
      │
      ▼
FAISS similarity search
(retrieves top 3 relevant chunks)
      │
      ▼
Build prompt with context
      │
      ▼
Send to OpenRouter API
      │
      ▼
LLM generates response
      │
      ▼
Backend returns {answer, source}
      │
      ▼
Frontend displays message
```

### 3. Chat Flow (Without Documents)

```
User types message
      │
      ▼
Frontend sends POST /chat/
{question, use_documents: false}
      │
      ▼
Backend receives request
      │
      ▼
Build prompt (no context)
      │
      ▼
Send to OpenRouter API
      │
      ▼
LLM generates response
      │
      ▼
Backend returns {answer, source: "internet"}
      │
      ▼
Frontend displays message
```

## Component Responsibilities

### Frontend (React)
- **Responsibility:** User interface and interaction
- **Does:**
  - Render UI components
  - Handle user input (text, voice, files)
  - Validate file selection
  - Display messages and status
  - Manage local state (chat history)
- **Does NOT:**
  - Process PDFs
  - Generate embeddings
  - Call LLM APIs directly
  - Store documents

### Backend (FastAPI)
- **Responsibility:** Business logic and AI processing
- **Does:**
  - Receive and validate requests
  - Process PDF files
  - Generate embeddings
  - Manage vector store
  - Call LLM APIs
  - Return structured responses
- **Does NOT:**
  - Render UI
  - Handle user interactions
  - Manage frontend state

### LangChain
- **Responsibility:** Document processing pipeline
- **Does:**
  - Load PDFs
  - Split text into chunks
  - Create embeddings
  - Manage vector store
  - Perform similarity search

### FAISS
- **Responsibility:** Vector storage and search
- **Does:**
  - Store document embeddings
  - Perform fast similarity search
  - Return relevant chunks

### OpenRouter/LLM
- **Responsibility:** Natural language generation
- **Does:**
  - Generate human-like responses
  - Understand context
  - Answer questions

## Technology Choices

### Why FastAPI?
- Fast and modern Python framework
- Automatic API documentation
- Type hints and validation
- Async support
- Easy integration with ML libraries

### Why LangChain?
- Standardized document processing
- Built-in text splitters
- Vector store abstractions
- Easy to swap components
- Active community

### Why FAISS?
- Fast similarity search
- Efficient memory usage
- Scales to millions of vectors
- CPU and GPU support
- Production-ready

### Why React?
- Component-based architecture
- Large ecosystem
- TypeScript support
- Fast development
- Great developer experience

## Security Considerations

### Current Implementation
- ✅ API keys on backend only
- ✅ CORS middleware
- ❌ No authentication
- ❌ No rate limiting
- ❌ No input sanitization
- ❌ No file size limits

### Production Requirements
- [ ] Add user authentication (JWT/OAuth)
- [ ] Implement rate limiting
- [ ] Validate and sanitize inputs
- [ ] Set file size limits
- [ ] Restrict CORS origins
- [ ] Add request logging
- [ ] Implement error tracking
- [ ] Add API key rotation
- [ ] Use HTTPS only
- [ ] Add request signing

## Scalability Considerations

### Current Limitations
- In-memory vector store (resets on restart)
- Single server instance
- No load balancing
- No caching
- Synchronous processing

### Scaling Strategy
1. **Horizontal Scaling**
   - Multiple backend instances
   - Load balancer
   - Shared vector store (Redis/PostgreSQL with pgvector)

2. **Vertical Scaling**
   - More CPU/RAM for embeddings
   - GPU for faster processing
   - SSD for faster I/O

3. **Caching**
   - Cache embeddings
   - Cache LLM responses
   - CDN for frontend

4. **Async Processing**
   - Queue for document processing
   - Background workers
   - Streaming responses

## Deployment Architecture

### Development
```
localhost:5173 (Frontend) → localhost:8000 (Backend)
```

### Production
```
CDN (Frontend) → Load Balancer → Backend Cluster
                                      ↓
                                Vector Store DB
                                      ↓
                                  LLM API
```

## Monitoring & Observability

### Recommended Tools
- **Logging:** Structured logs (JSON)
- **Metrics:** Prometheus + Grafana
- **Tracing:** OpenTelemetry
- **Errors:** Sentry
- **Uptime:** UptimeRobot

### Key Metrics
- Request latency
- Error rates
- Document processing time
- LLM API response time
- Vector search performance
- Active users
- Storage usage
