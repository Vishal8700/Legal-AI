# Justitia.ai - Legal Document Analysis Platform

AI-powered legal document analysis and consultation platform with RAG (Retrieval Augmented Generation) capabilities.

## 🎯 Overview

Justitia.ai helps users analyze legal documents and get AI-powered legal consultations. The platform uses a modern architecture with:
- **Backend:** FastAPI + LangChain + FAISS for document processing and RAG
- **Frontend:** React + TypeScript + Vite for the user interface

## ✨ Features

- 📄 Upload and analyze 2-3 PDF documents simultaneously
- 🤖 AI-powered chat with context from uploaded documents
- 💬 General legal consultation without documents
- 🔍 Vector similarity search for relevant document sections
- 🎙️ Voice input support
- 📱 Responsive design with dark mode

## 🏗️ Architecture

```
Frontend (React)  →  Backend API (FastAPI)  →  LLM (OpenRouter)
                           ↓
                    Vector Store (FAISS)
```

### Backend Stack
- FastAPI - REST API framework
- LangChain - Document processing pipeline
- FAISS - Vector similarity search
- HuggingFace - Text embeddings
- OpenRouter - LLM API access

### Frontend Stack
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool
- TailwindCSS - Styling
- Zustand - State management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenRouter API key

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```
OPENROUTER_API_KEY=your_key_here
```

Start backend:
```bash
python main.py
```

### 2. Frontend Setup
```bash
cd JustitiaAI-main
npm install
npm run dev
```

Verify `.env` has:
```
VITE_API_BASE_URL=http://localhost:8000
```

## 📖 Documentation

- [Setup Checklist](SETUP_CHECKLIST.md) - Step-by-step setup guide
- [Migration Guide](MIGRATION_GUIDE.md) - Architecture details
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Changes Summary](CHANGES_SUMMARY.md) - What was changed
- [Additional Updates](ADDITIONAL_UPDATES_NEEDED.md) - Future improvements

## 🎮 Usage

### Chat Without Documents
1. Navigate to Chat page
2. Type your legal question
3. Get AI-powered response

### Chat With Documents (RAG)
1. Click paperclip icon
2. Select 2-3 PDF files
3. Click upload button
4. Wait for confirmation
5. Ask questions about your documents

## 🔌 API Endpoints

- `POST /upload-pdfs/` - Upload documents
- `POST /chat/` - Send chat message
- `GET /health` - Check backend status
- `GET /` - API documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for details.

## 🛠️ Development

### Backend
```bash
cd backend
python main.py
```
Runs on http://localhost:8000

### Frontend
```bash
cd JustitiaAI-main
npm run dev
```
Runs on http://localhost:5173

## 🧪 Testing

Backend tests:
```bash
cd backend
python test_chatbot.py
```

## 📦 Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
│
├── JustitiaAI-main/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Chat.tsx     # Main chat interface
│   │   ├── services/
│   │   │   └── api.ts       # Backend API client
│   │   └── components/      # React components
│   ├── package.json         # Node dependencies
│   └── .env                 # Frontend config
│
└── Documentation files
```

## 🔐 Security Notes

- API keys stored securely in backend
- CORS configured (update for production)
- No authentication (add for production)
- File validation needed for production

## 🚧 Known Limitations

- Vector store resets on server restart (in-memory)
- No user authentication
- No rate limiting
- CORS allows all origins (development only)

## 📝 License

[Your License Here]

## 🤝 Contributing

[Contributing guidelines]

## 📧 Support

[Support information]
