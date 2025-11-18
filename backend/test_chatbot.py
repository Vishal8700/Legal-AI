import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print("Health Check:", json.dumps(response.json(), indent=2))
        return response.json()
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to server. Make sure the server is running on port 8000")
        print("Run: python main.py")
        return None

def test_upload_pdfs():
    """Test PDF upload"""
    try:
        files = [
            ('files', ('90500000754072.pdf', open('90500000754072.pdf', 'rb'), 'application/pdf')),
            ('files', ('informationm1.pdf', open('informationm1.pdf', 'rb'), 'application/pdf')),
            ('files', ('resumesem7nsut.pdf', open('resumesem7nsut.pdf', 'rb'), 'application/pdf'))
        ]
        
        print("Uploading PDFs...")
        response = requests.post(f"{BASE_URL}/upload-pdfs/", files=files)
        
        if response.status_code == 200:
            print("✓ Upload successful!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"✗ Upload failed with status {response.status_code}")
            print(response.text)
        
        return response.json()
    except FileNotFoundError as e:
        print(f"ERROR: File not found - {e}")
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def test_chat(question: str, use_docs: bool = True):
    """Test chat endpoint"""
    try:
        payload = {
            "question": question,
            "use_documents": use_docs
        }
        
        print(f"\n{'='*60}")
        print(f"Question: {question}")
        print(f"Use Documents: {use_docs}")
        print('='*60)
        
        response = requests.post(f"{BASE_URL}/chat/", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n💬 ANSWER:")
            print(result.get('answer', 'N/A'))
            print(f"\n📍 SOURCE: {result.get('source', 'N/A')}")
            return result
        else:
            print(f"✗ Chat failed with status {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def run_all_tests():
    """Run complete test suite"""
    print("="*60)
    print("LEGAL DOCUMENT CHATBOT - TEST SUITE")
    print("="*60)
    
    # Test 1: Health check
    print("\n[TEST 1] Health Check")
    print("-"*60)
    health = test_health()
    if not health:
        return
    
    time.sleep(1)
    
    # Test 2: Upload PDFs
    print("\n[TEST 2] Upload PDFs")
    print("-"*60)
    upload_result = test_upload_pdfs()
    if not upload_result:
        return
    
    time.sleep(2)
    
    # Test 3: Chat with documents
    print("\n[TEST 3] Chat with Documents")
    print("-"*60)
    
    test_chat("Who signed this document?", use_docs=True)
    time.sleep(1)
    
    test_chat("What is the certificate number and date of issue?", use_docs=True)
    time.sleep(1)
    
    # Test 4: Chat without documents (general knowledge)
    print("\n[TEST 4] Chat without Documents (General Knowledge)")
    print("-"*60)
    
    test_chat("What is a legal contract?", use_docs=False)
    time.sleep(1)
    
    # Test 5: Mixed - documents + general knowledge
    print("\n[TEST 5] Mixed Query (Documents + General Knowledge)")
    print("-"*60)
    
    test_chat("Explain the key terms in this document and their legal significance", use_docs=True)
    
    print("\n" + "="*60)
    print("✓ ALL TESTS COMPLETED")
    print("="*60)

if __name__ == "__main__":
    run_all_tests()
