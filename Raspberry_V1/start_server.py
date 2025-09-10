#!/usr/bin/env python3
"""
Simple startup script for the Scent Controller
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import flask
        import json
        print("✓ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("  Please install with: pip install flask")
        return False

def start_server():
    """Start the Flask server"""
    print("Starting Scent Controller Server...")
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Change to the script directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Start the Flask app
        subprocess.run([sys.executable, "app.py"], check=True)
        
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Scent Controller Startup")
    print("=" * 30)
    
    if check_dependencies():
        start_server()
    else:
        print("\nPlease install the required dependencies first.")
        sys.exit(1)