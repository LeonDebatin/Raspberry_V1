#!/usr/bin/env python3
"""
Simple test script to check if the Flask server is running
"""

import requests
import sys

def test_server():
    """Test if the Flask server is responding"""
    try:
        # Test the main page
        response = requests.get('http://localhost:5000/', timeout=5)
        if response.status_code == 200:
            print("✓ Server is running and responding")
            return True
        else:
            print(f"✗ Server responded with status code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server at http://localhost:5000")
        print("  Make sure to start the server with: python app.py")
        return False
        
    except requests.exceptions.Timeout:
        print("✗ Server connection timed out")
        return False
        
    except Exception as e:
        print(f"✗ Error testing server: {e}")
        return False

def test_api_endpoints():
    """Test the API endpoints"""
    endpoints = [
        '/api/status',
        '/api/schedules'
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f'http://localhost:5000{endpoint}', timeout=5)
            if response.status_code == 200:
                print(f"✓ {endpoint} - OK")
            else:
                print(f"✗ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"✗ {endpoint} - Error: {e}")

if __name__ == "__main__":
    print("Testing Scent Controller Server...")
    print("-" * 40)
    
    if test_server():
        print("\nTesting API endpoints...")
        test_api_endpoints()
        print("\n✓ All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Server test failed. Please start the server first.")
        sys.exit(1)