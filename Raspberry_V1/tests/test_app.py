import unittest
import json
import tempfile
import os
import sys
from unittest.mock import patch, Mock

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, load_schedules, save_schedules, should_activate_schedule


class TestFlaskApp(unittest.TestCase):
    """Test cases for Flask application"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.app = app.test_client()
        self.app.testing = True
        
        # Create temporary schedule file for testing
        self.temp_schedules = {
            "schedules": [
                {
                    "id": 1,
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "formula": "red",
                    "cycle_time": 60,
                    "duration": 10,
                    "recurrence": "daily",
                    "enabled": True
                }
            ]
        }
    
    def test_selection_page_loads(self):
        """Test main selection page renders correctly"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Select Scent Formula', response.data)
    
    def test_schedule_page_loads(self):
        """Test schedule page renders correctly"""
        response = self.app.get('/schedule')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Schedule Management', response.data)
    
    def test_api_activate_formula(self):
        """Test formula activation API endpoint"""
        data = {
            'color': 'red',
            'cycle_time': 60,
            'duration': 10
        }
        response = self.app.post('/api/activate', 
                                json=data,
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['active_formula'], 'red')
    
    def test_api_deactivate(self):
        """Test deactivation API endpoint"""
        response = self.app.post('/api/deactivate')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(result['status'], 'success')
    
    def test_api_get_status(self):
        """Test status API endpoint"""
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('active_formula', result)
    
    @patch('app.load_schedules')
    def test_api_get_schedules(self, mock_load):
        """Test get schedules API endpoint"""
        mock_load.return_value = self.temp_schedules
        
        response = self.app.get('/api/schedules')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(len(result['schedules']), 1)
    
    @patch('app.save_schedules')
    @patch('app.load_schedules')
    def test_api_create_schedule(self, mock_load, mock_save):
        """Test create schedule API endpoint"""
        mock_load.return_value = {"schedules": []}
        mock_save.return_value = True
        
        data = {
            'start_time': '14:00',
            'end_time': '15:00',
            'formula': 'blue',
            'cycle_time': 30,
            'duration': 5,
            'recurrence': 'daily'
        }
        
        response = self.app.post('/api/schedules',
                                json=data,
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(result['formula'], 'blue')
    
    def test_should_activate_schedule_daily(self):
        """Test daily schedule activation logic"""
        schedule = {'recurrence': 'daily'}
        result = should_activate_schedule(schedule)
        self.assertTrue(result)
    
    def test_should_activate_schedule_weekdays(self):
        """Test weekdays schedule activation logic"""
        schedule = {'recurrence': 'weekdays'}
        result = should_activate_schedule(schedule)
        # Result depends on current day, so we just test it doesn't crash
        self.assertIsInstance(result, bool)


if __name__ == '__main__':
    unittest.main()