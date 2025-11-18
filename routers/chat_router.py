from fastapi import APIRouter, HTTPException
from models.chat_request import ChatRequest
from core.vector_store import retrieve_relevant_docs, vector_store
from core.llm_client import call_llm

router = APIRouter()

@router.post("/chat/")
async def chat(request: ChatRequest):
    if request.use_documents and vector_store is not None:
        docs = retrieve_relevant_docs(request.question, top_k=3)
        context_text = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"""
Answer the user's question using both the provided document context and your general knowledge.

DOCUMENT CONTEXT:
{context_text}

USER QUESTION: {request.question}

Return JSON:
{{
"answer": "your comprehensive answer",
"source": "documents and internet"
}}
"""
    else:
        prompt = f"""
USER QUESTION: {request.question}

Return JSON:
{{
"answer": "your answer",
"source": "internet"
}}
"""

    result, error = call_llm(prompt)

    if error:
        raise HTTPException(status_code=500, detail=error)

    return result
