from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str
    use_documents: bool = True
