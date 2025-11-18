import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat_with_docs():
    """Test chat endpoint with documents"""
    payload = {
        "question": "Who signed this document?",
        "use_documents": True
    }
    
    response = requests.post(f"{BASE_URL}/chat/", json=payload)
    print("Chat with Documents:")
    print(json.dumps(response.json(), indent=2))
    print("\n" + "="*60 + "\n")

def test_chat_without_docs():
    """Test chat endpoint without documents (internet only)"""
    payload = {
        "question": "What is a legal contract?",
        "use_documents": False
    }
    
    response = requests.post(f"{BASE_URL}/chat/", json=payload)
    print("Chat without Documents (Internet):")
    print(json.dumps(response.json(), indent=2))
    print("\n" + "="*60 + "\n")

def test_chat_general_question():
    """Test chat with general question using both sources"""
    payload = {
        "question": "What are the key elements of a valid contract?",
        "use_documents": True
    }
    
    response = requests.post(f"{BASE_URL}/chat/", json=payload)
    print("Chat with General Question:")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("="*60)
    print("TESTING CHAT ENDPOINT")
    print("="*60 + "\n")
    
    test_chat_with_docs()
    test_chat_without_docs()
    test_chat_general_question()
