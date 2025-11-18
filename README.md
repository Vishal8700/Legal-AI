# Legal-AI  
**Indian Legal Document RAG Assistant**

Legal-AI is a Retrieval-Augmented Generation (RAG) system purpose-built for Indian legal documents. It enables users to upload agreements, extract clauses, ask legal questions, and receive context-aware, Indian-law-aligned answers. The platform also summarises documents and simplifies complex legal text for improved accessibility.

---

## 1. Objective  

This project aims to build an intelligent legal assistant that can:

- Answer user queries using uploaded legal documents  
- Provide responses aligned with Indian legal standards  
- Retrieve relevant clauses from the document using FAISS  
- Generate quick and detailed document summaries  
- Simplify legal language for better understanding  

---

## 2. Key Features  

### Legal Document Intelligence  
- Understands legal contract structure  
- Retrieves relevant clauses via FAISS  
- Indian-law-aware compliance responses  

### Document Summarization  
- Quick summary (5–8 lines)  
- Full detailed summary  
- Clause-wise breakdown  

### Query Assistance  
Users can ask questions such as:  
- “Is there any termination clause?”  
- “What is the payment schedule?”  
- “Is the agreement compliant with Indian law standards?”  

### Full RAG Pipeline  
- PDF ingestion  
- Text cleaning and normalization  
- Chunking (1000 characters with 150 overlap)  
- Embedding generation  
- FAISS vector storage  + Langchain for Chain Invocation
- LLM-based reasoning with legal context  

---

## 3. System Architecture  

### High-Level RAG Workflow  
<img width="3700" height="1388" alt="Legal RAG System Architecture (1)" src="https://github.com/user-attachments/assets/fafccbf6-5809-44a3-bf78-3bd4ad37ec41" />

## 4.  Tech Stack

## Frontend
- Vite  
- React  
- TailwindCSS  
- SWC compiler  

## Backend
- FastAPI  
- Python
- Langchain for Chain Invocation
- FAISS for vector search  
- OpenAI / HuggingFace embeddings  
- LLM-based reasoning (Indian legal context)  

## Deployment
- Vercel or Render ( simple and Free )
