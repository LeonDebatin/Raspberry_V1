import requests
import json

# Test the schedule status API
response = requests.get('http://localhost:5001/api/schedule-status')
print("Status Code:", response.status_code)
print("Response:")
print(json.dumps(response.json(), indent=2))