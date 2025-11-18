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
    """Test PDF upload endpoint with 90500000754072.pdf and other documents"""
    try:
        files = [
            ('files', ('90500000754072.pdf', open('90500000754072.pdf', 'rb'), 'application/pdf')),
            ('files', ('90500000754072.pdf', open('90500000754072.pdf', 'rb'), 'application/pdf')),
            ('files', ('90500000754072.pdf', open('90500000754072.pdf', 'rb'), 'application/pdf'))


           
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

def test_query(query: str):
    """Test query endpoint"""
    try:
        payload = {
            "query": query,
            "top_k": 5
        }
        
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print('='*60)
        
        response = requests.post(f"{BASE_URL}/query/", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print("\n📄 SUMMARY:")
            print(result.get('summary', 'N/A'))
            
            print("\n� ALNSWER:")
            print(result.get('answer', 'N/A'))
            
            return result
        else:
            print(f"✗ Query failed with status {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def run_all_tests():
    """Run complete test suite"""
    print("="*60)
    print("LEGAL DOCUMENT ANALYSIS API - TEST SUITE")
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
    
    # Test 3: Query documents
    print("\n[TEST 3] Query Documents")
    print("-"*60)
    
    queries = [
       "Who sign this doc",
       "what is the certificate number and date of issue and name of person that this doc is issued"
    ]
    
    for query in queries:
        test_query(query)
        time.sleep(1)
    
    print("\n" + "="*60)
    print("✓ ALL TESTS COMPLETED")
    print("="*60)

if __name__ == "__main__":
    run_all_tests()
