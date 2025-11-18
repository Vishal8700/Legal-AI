# Frontend-Backend Migration Guide

## Overview
The application has been refactored to separate concerns:
- **Backend**: Handles all AI processing, document analysis, and RAG operations
- **Frontend**: Focuses on UI/UX and communicates with backend via REST API

## Changes Made

### Backend (FastAPI)
1. **Added CORS support** to allow frontend requests
2. **Endpoints available**:
   - `POST /upload-pdfs/` - Upload 2-3 PDF files for analysis
   - `POST /chat/` - Send chat messages (with or without document context)
   - `GET /health` - Check backend status
   - `GET /` - API documentation

### Frontend (React + TypeScript)

#### New Files Created
- `src/services/api.ts` - API service layer for backend communication

#### Modified Files
- `src/pages/Chat.tsx` - Refactored to use backend API instead of direct OpenRouter calls
- `.env` - Added `VITE_API_BASE_URL` configuration

#### Key Changes in Chat.tsx
1. **Removed**:
   - Direct OpenRouter API calls
   - PDF text extraction (PDFToText)
   - Image OCR processing
   - All AI processing logic from frontend

2. **Added**:
   - Backend API integration via `api.ts`
   - Support for uploading 2-3 PDFs to backend
   - Document upload status tracking
   - Cleaner separation of concerns

3. **Updated UI**:
   - File upload now supports multiple PDFs (2-3 required)
   - Upload button to send PDFs to backend
   - Status indicator when documents are uploaded
   - Dynamic placeholder text based on document status

## How to Use

### 1. Start Backend Server
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs on `http://localhost:8000`

### 2. Configure Backend API Key
Create `backend/.env`:
```
OPENROUTER_API_KEY=your_api_key_here
```

### 3. Start Frontend
```bash
cd JustitiaAI-main
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` (or configured port)

### 4. Configure Frontend
Update `JustitiaAI-main/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Usage Flow

### Without Documents (General Chat)
1. Open chat interface
2. Type your legal question
3. Get AI-powered response from backend

### With Documents (RAG-based Analysis)
1. Click the paperclip icon
2. Select 2-3 PDF files
3. Click the upload icon to send to backend
4. Wait for "Documents uploaded and ready" confirmation
5. Ask questions about your documents
6. Backend will use RAG to provide context-aware answers

## API Endpoints

### POST /upload-pdfs/
Upload 2-3 PDF files for analysis
```typescript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
// Response: { message, total_chunks, files_processed }
```

### POST /chat/
Send chat message
```typescript
{
  "question": "What is this contract about?",
  "use_documents": true  // false for general knowledge only
}
// Response: { answer, source }
```

### GET /health
Check backend status
```typescript
// Response: { status, documents_loaded, using }
```

## Benefits of This Architecture

1. **Security**: API keys stay on backend, never exposed to client
2. **Performance**: Heavy processing (embeddings, vector search) on server
3. **Scalability**: Backend can be scaled independently
4. **Maintainability**: Clear separation of concerns
5. **Flexibility**: Easy to swap AI providers or add features
6. **Cost Control**: Centralized API usage monitoring

## Environment Variables

### Backend (.env)
```
OPENROUTER_API_KEY=your_key_here
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_OPENROUTER_API_KEY=  # No longer used, can be removed
VITE_GEMINI_API_KEY=      # No longer used, can be removed
```

## Deployment Notes

### Production Backend
- Set `allow_origins` in CORS to specific frontend URL
- Use environment variables for configuration
- Consider rate limiting and authentication
- Deploy on cloud service (AWS, GCP, Azure, etc.)

### Production Frontend
- Update `VITE_API_BASE_URL` to production backend URL
- Build with `npm run build`
- Deploy static files to CDN or hosting service

## Troubleshooting

### Backend not responding
- Check if backend is running: `curl http://localhost:8000/health`
- Verify OPENROUTER_API_KEY is set in backend/.env
- Check backend logs for errors

### CORS errors
- Ensure backend CORS middleware is configured
- Verify frontend is using correct API_BASE_URL
- Check browser console for specific CORS errors

### File upload fails
- Ensure 2-3 PDF files are selected
- Check file size limits
- Verify backend has write permissions for temp files

## Next Steps

Consider adding:
- User authentication
- Chat history persistence (database)
- Rate limiting
- API key management
- Document management (list, delete uploaded docs)
- Streaming responses for better UX
- Error logging and monitoring
