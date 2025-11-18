# Quick Start Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- npm or yarn installed

## Setup Instructions

### 1. Backend Setup (Terminal 1)
```bash
# Navigate to backend
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Create .env file with your API key
# Copy .env.example to .env and add your OPENROUTER_API_KEY

# Start backend server
python main.py
```

Backend will run on: http://localhost:8000

### 2. Frontend Setup (Terminal 2)
```bash
# Navigate to frontend
cd JustitiaAI-main

# Install dependencies (first time only)
npm install

# Verify .env has VITE_API_BASE_URL=http://localhost:8000

# Start frontend dev server
npm run dev
```

Frontend will run on: http://localhost:5173 (or next available port)

## Testing the Application

1. Open browser to frontend URL (e.g., http://localhost:5173)
2. Navigate to Chat page
3. Try asking a general question: "What is a contract?"
4. Upload 2-3 PDF files using the paperclip icon
5. Click the upload button to send PDFs to backend
6. Wait for confirmation message
7. Ask questions about your documents

## Verify Backend is Running
Open http://localhost:8000 in browser - you should see API documentation

Or use curl:
```bash
curl http://localhost:8000/health
```

## Common Issues

### Backend won't start
- Check if port 8000 is already in use
- Verify Python virtual environment is activated
- Ensure all dependencies are installed
- Check .env file has OPENROUTER_API_KEY

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check .env has correct VITE_API_BASE_URL
- Look for CORS errors in browser console
- Restart frontend dev server after .env changes

### File upload fails
- Ensure you select 2-3 PDF files (not more, not less)
- Check backend logs for errors
- Verify PDFs are valid and not corrupted
