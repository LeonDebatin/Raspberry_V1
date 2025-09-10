# Test Suite for Raspberry Pi Scent Controller

This directory contains the test suite for the Raspberry Pi Scent Controller application.

## Test Structure

- `test_gpio_controller.py` - Unit tests for GPIO controller functionality
- `test_app.py` - Unit tests for Flask application routes and API endpoints  
- `test_integration.py` - Integration tests for complete workflows
- `__init__.py` - Test package initialization

## Running Tests

### Run All Tests
```bash
python run_tests.py
```

### Run Specific Test Categories
```bash
# GPIO controller tests only
python run_tests.py gpio

# Flask app tests only  
python run_tests.py app

# Integration tests only
python -m unittest tests.test_integration
```

### Run Individual Test Files
```bash
# Run GPIO controller tests
python -m unittest tests.test_gpio_controller

# Run Flask app tests
python -m unittest tests.test_app

# Run integration tests
python -m unittest tests.test_integration
```

## Test Coverage

### GPIO Controller Tests (`test_gpio_controller.py`)
- ✅ Single formula activation (deactivates others)
- ✅ Timing parameter validation
- ✅ Invalid formula handling
- ✅ Deactivate all functionality
- ✅ Schedule vs manual activation priority
- ✅ Status reporting

### Flask App Tests (`test_app.py`)
- ✅ Selection page rendering
- ✅ Schedule page rendering
- ✅ Formula activation API endpoint
- ✅ Deactivation API endpoint
- ✅ Status API endpoint
- ✅ Schedule CRUD API endpoints
- ✅ Schedule activation logic

### Integration Tests (`test_integration.py`)
- ✅ Complete schedule CRUD workflow
- ✅ Time range validation logic
- ✅ Recurrence pattern testing
- ✅ Formula activation workflow

## Test Requirements

The tests use Python's built-in `unittest` framework and require no additional dependencies beyond what's already needed for the main application.

## Mock Usage

Tests use `unittest.mock` to mock GPIO operations and file I/O operations, allowing tests to run without actual hardware or file system dependencies.

## Continuous Integration

These tests can be integrated into CI/CD pipelines by running:
```bash
python run_tests.py
```

The test runner returns appropriate exit codes (0 for success, 1 for failure) for CI integration.