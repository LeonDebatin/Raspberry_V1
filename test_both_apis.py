import requests
import json

try:
    # Test the schedule status API
    response = requests.get('http://localhost:5001/api/schedule-status')
    print("Status Code:", response.status_code)
    print("Response:")
    data = response.json()
    print(json.dumps(data, indent=2))
    
    # Also test the regular status endpoint
    print("\n" + "="*50)
    print("Regular status endpoint:")
    response2 = requests.get('http://localhost:5001/api/status')
    print("Status Code:", response2.status_code)
    print("Response:")
    data2 = response2.json()
    print(json.dumps(data2, indent=2))
    
except Exception as e:
    print(f"Error: {e}")