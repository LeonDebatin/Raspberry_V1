#!/usr/bin/env python3
"""
Test runner for Raspberry Pi Scent Controller

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py gpio         # Run GPIO tests only
    python run_tests.py app          # Run Flask app tests only
"""

import unittest
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_tests(test_type=None):
    """Run test suite"""
    
    if test_type == 'gpio':
        # Run only GPIO controller tests
        from tests.test_gpio_controller import TestSimpleGPIOController
        suite = unittest.TestLoader().loadTestsFromTestCase(TestSimpleGPIOController)
    elif test_type == 'app':
        # Run only Flask app tests
        from tests.test_app import TestFlaskApp
        suite = unittest.TestLoader().loadTestsFromTestCase(TestFlaskApp)
    else:
        # Run all tests
        loader = unittest.TestLoader()
        suite = loader.discover('tests', pattern='test_*.py')
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return exit code based on test results
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    test_type = sys.argv[1] if len(sys.argv) > 1 else None
    exit_code = run_tests(test_type)
    sys.exit(exit_code)