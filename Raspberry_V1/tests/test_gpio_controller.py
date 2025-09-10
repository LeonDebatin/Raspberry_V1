import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gpio_controller import SimpleGPIOController


class TestSimpleGPIOController(unittest.TestCase):
    """Test cases for SimpleGPIOController"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.controller = SimpleGPIOController()
        self.test_mapping = {
            'red': 18,
            'blue': 19,
            'yellow': 20,
            'green': 21
        }
        self.controller.set_pin_mapping(self.test_mapping)
    
    def tearDown(self):
        """Clean up after tests"""
        self.controller.cleanup()
    
    def test_activate_single_formula(self):
        """Test activating one formula deactivates others"""
        # Activate red formula
        result = self.controller.activate_formula('red', 60, 10)
        self.assertTrue(result)
        self.assertEqual(self.controller.active_formula, 'red')
        
        # Activate blue formula - should deactivate red
        result = self.controller.activate_formula('blue', 30, 5)
        self.assertTrue(result)
        self.assertEqual(self.controller.active_formula, 'blue')
    
    def test_timing_parameters(self):
        """Test cycle time and duration settings"""
        result = self.controller.activate_formula('green', 120, 15)
        self.assertTrue(result)
        self.assertEqual(self.controller.active_formula, 'green')
    
    def test_invalid_formula(self):
        """Test handling of invalid formula colors"""
        result = self.controller.activate_formula('purple', 60, 10)
        self.assertFalse(result)
        self.assertIsNone(self.controller.active_formula)
    
    def test_deactivate_all(self):
        """Test deactivating all formulas"""
        # Activate a formula first
        self.controller.activate_formula('red', 60, 10)
        self.assertEqual(self.controller.active_formula, 'red')
        
        # Deactivate all
        self.controller.deactivate_all()
        self.assertIsNone(self.controller.active_formula)
    
    def test_schedule_vs_manual_activation(self):
        """Test priority between scheduled and manual activations"""
        # Start scheduled activation
        result = self.controller.activate_formula('red', 60, 10, is_scheduled=True)
        self.assertTrue(result)
        self.assertEqual(self.controller.active_schedule, 'red')
        self.assertFalse(self.controller.user_override)
        
        # Manual override
        result = self.controller.activate_formula('blue', 30, 5, is_scheduled=False)
        self.assertTrue(result)
        self.assertEqual(self.controller.active_formula, 'blue')
        self.assertTrue(self.controller.user_override)
    
    def test_get_status(self):
        """Test status reporting"""
        status = self.controller.get_status()
        self.assertIn('active_formula', status)
        self.assertIn('active_schedule', status)
        self.assertIn('user_override', status)
        self.assertIn('pin_mapping', status)
        self.assertIn('gpio_available', status)


if __name__ == '__main__':
    unittest.main()