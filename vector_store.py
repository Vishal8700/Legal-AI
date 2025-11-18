from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

vector_store = None

def build_vector_store(documents):
    global vector_store
    vector_store = FAISS.from_documents(documents, embeddings)
    return vector_store

def retrieve_relevant_docs(query, top_k=5):
    if vector_store is None:
        return []
    return vector_store.similarity_search(query, k=top_k)
