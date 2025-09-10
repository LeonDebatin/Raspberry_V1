import unittest
import json
import tempfile
import os
import sys
from datetime import datetime
from unittest.mock import patch, Mock

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, should_activate_schedule, is_time_in_range


class TestIntegration(unittest.TestCase):
    """Integration tests for schedule management"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.app = app.test_client()
        self.app.testing = True
    
    def test_schedule_crud_workflow(self):
        """Test complete schedule CRUD workflow"""
        # 1. Get initial schedules
        response = self.app.get('/api/schedules')
        self.assertEqual(response.status_code, 200)
        initial_data = json.loads(response.data)
        initial_count = len(initial_data.get('schedules', []))
        
        # 2. Create new schedule
        new_schedule = {
            'start_time': '10:00',
            'end_time': '11:00',
            'formula': 'green',
            'cycle_time': 90,
            'duration': 15,
            'recurrence': 'weekdays'
        }
        
        response = self.app.post('/api/schedules',
                                json=new_schedule,
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        created_schedule = json.loads(response.data)
        schedule_id = created_schedule['id']
        
        # 3. Verify schedule was created
        response = self.app.get('/api/schedules')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['schedules']), initial_count + 1)
        
        # 4. Update schedule
        updated_data = {
            'start_time': '11:00',
            'end_time': '12:00',
            'formula': 'blue',
            'cycle_time': 60,
            'duration': 10,
            'recurrence': 'daily'
        }
        
        response = self.app.put(f'/api/schedules/{schedule_id}',
                               json=updated_data,
                               content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # 5. Delete schedule
        response = self.app.delete(f'/api/schedules/{schedule_id}')
        self.assertEqual(response.status_code, 200)
        
        # 6. Verify schedule was deleted
        response = self.app.get('/api/schedules')
        self.assertEqual(response.status_code, 200)
        final_data = json.loads(response.data)
        self.assertEqual(len(final_data['schedules']), initial_count)
    
    def test_time_range_validation(self):
        """Test time range validation logic"""
        # Test normal time range
        self.assertTrue(is_time_in_range('10:30', '10:00', '11:00'))
        self.assertFalse(is_time_in_range('09:30', '10:00', '11:00'))
        self.assertFalse(is_time_in_range('11:30', '10:00', '11:00'))
        
        # Test overnight time range
        self.assertTrue(is_time_in_range('23:30', '23:00', '01:00'))
        self.assertTrue(is_time_in_range('00:30', '23:00', '01:00'))
        self.assertFalse(is_time_in_range('02:00', '23:00', '01:00'))
    
    def test_recurrence_patterns(self):
        """Test various recurrence patterns"""
        # Daily schedule
        daily_schedule = {'recurrence': 'daily'}
        self.assertTrue(should_activate_schedule(daily_schedule))
        
        # Weekdays schedule
        weekdays_schedule = {'recurrence': 'weekdays'}
        result = should_activate_schedule(weekdays_schedule)
        self.assertIsInstance(result, bool)
        
        # Weekends schedule
        weekends_schedule = {'recurrence': 'weekends'}
        result = should_activate_schedule(weekends_schedule)
        self.assertIsInstance(result, bool)
        
        # Specific day schedule
        monday_schedule = {'recurrence': 'monday'}
        result = should_activate_schedule(monday_schedule)
        self.assertIsInstance(result, bool)
    
    def test_formula_activation_workflow(self):
        """Test complete formula activation workflow"""
        # 1. Check initial status
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        
        # 2. Activate formula
        activation_data = {
            'color': 'red',
            'cycle_time': 60,
            'duration': 10
        }
        
        response = self.app.post('/api/activate',
                                json=activation_data,
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(result['status'], 'success')
        
        # 3. Check status after activation
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        status = json.loads(response.data)
        self.assertEqual(status['active_formula'], 'red')
        
        # 4. Deactivate
        response = self.app.post('/api/deactivate')
        self.assertEqual(response.status_code, 200)
        
        # 5. Check status after deactivation
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        status = json.loads(response.data)
        self.assertIsNone(status['active_formula'])


if __name__ == '__main__':
    unittest.main()