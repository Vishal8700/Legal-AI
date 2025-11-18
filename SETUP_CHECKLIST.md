# Setup Checklist

## ✅ Pre-flight Checklist

### Backend Setup
- [ ] Python 3.8+ installed
- [ ] Navigate to `backend` folder
- [ ] Create virtual environment: `python -m venv .venv`
- [ ] Activate virtual environment
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Create `.env` file from `.env.example`
- [ ] Add your `OPENROUTER_API_KEY` to `.env`
- [ ] Start backend: `python main.py`
- [ ] Verify backend running: Open http://localhost:8000

### Frontend Setup
- [ ] Node.js 16+ installed
- [ ] Navigate to `JustitiaAI-main` folder
- [ ] Install dependencies: `npm install`
- [ ] Verify `.env` has `VITE_API_BASE_URL=http://localhost:8000`
- [ ] Start frontend: `npm run dev`
- [ ] Open browser to frontend URL (usually http://localhost:5173)

## ✅ Testing Checklist

### Basic Functionality
- [ ] Frontend loads without errors
- [ ] Navigate to Chat page
- [ ] Ask a general question (e.g., "What is a contract?")
- [ ] Receive AI response

### Document Upload & RAG
- [ ] Click paperclip icon in chat
- [ ] Select 2-3 PDF files
- [ ] Click upload button
- [ ] See success message: "Documents uploaded and ready"
- [ ] Ask question about documents
- [ ] Receive context-aware response

### Error Handling
- [ ] Try uploading only 1 PDF (should show error)
- [ ] Try uploading 4+ PDFs (should show error)
- [ ] Stop backend and send message (should show connection error)

## ✅ Verification Commands

### Check Backend Health
```bash
curl http://localhost:8000/health
```
Expected response:
```json
{
  "status": "healthy",
  "documents_loaded": false,
  "using": "LangChain + FAISS"
}
```

### Check Backend Root
```bash
curl http://localhost:8000/
```
Should return API documentation

## 🔧 Troubleshooting

### Backend Issues
- Port 8000 in use? Change port in `main.py` and update frontend `.env`
- Missing dependencies? Run `pip install -r requirements.txt` again
- API key error? Check `.env` file has valid `OPENROUTER_API_KEY`

### Frontend Issues
- Can't connect to backend? Verify `VITE_API_BASE_URL` in `.env`
- After changing `.env`? Restart dev server (`npm run dev`)
- CORS errors? Check backend CORS middleware is enabled

### File Upload Issues
- Must select exactly 2-3 PDF files
- Files must be valid PDFs
- Check backend logs for processing errors

## 📚 Documentation

- `MIGRATION_GUIDE.md` - Detailed migration information
- `API_DOCUMENTATION.md` - Complete API reference
- `start-dev.md` - Quick start guide
- `CHANGES_SUMMARY.md` - Summary of all changes

## 🎉 Success Indicators

You're all set when:
- ✅ Backend responds at http://localhost:8000
- ✅ Frontend loads in browser
- ✅ Can send messages and get responses
- ✅ Can upload PDFs and query them
- ✅ No console errors in browser or terminal
