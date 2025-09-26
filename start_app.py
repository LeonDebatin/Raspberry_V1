#!/usr/bin/env python3
"""
Improved startup script for the Scent Controller Flask app
"""

import socket
import sys
import time
from app import app, gpio_controller


def check_port(host, port):
    """Check if a port is available"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        return result != 0  # True if port is available
    except Exception:
        return False


def find_available_port(start_port=5000, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if check_port("127.0.0.1", port):
            return port
    return None


def main():
    print("🚀 Starting Scent Controller...")
    print(f"📍 Current directory: {sys.path[0]}")

    # Check if default port is available
    default_port = 5000
    if not check_port("127.0.0.1", default_port):
        print(f"⚠️  Port {default_port} is already in use!")

        # Try to find an alternative port
        alternative_port = find_available_port(5001)
        if alternative_port:
            print(f"🔄 Using alternative port: {alternative_port}")
            default_port = alternative_port
        else:
            print("❌ No available ports found!")
            print(
                "Please close other applications using ports 5000-5010 and try again."
            )
            return

    print(f"🌐 Starting server on http://localhost:{default_port}")
    print(f"🌐 Also accessible via http://127.0.0.1:{default_port}")
    print("📱 On mobile devices, use your computer's IP address")
    print()
    print("🎯 Available pages:")
    print(f"   • Selection: http://localhost:{default_port}/")
    print(f"   • Schedule:  http://localhost:{default_port}/schedule")
    print()
    print("⏹️  Press Ctrl+C to stop the server")
    print("=" * 50)

    try:
        # Start the Flask app
        app.run(
            host="0.0.0.0",  # Accept connections from any IP
            port=default_port,
            debug=False,  # Disable debug mode for cleaner output
            use_reloader=False,  # Disable auto-reloader to prevent double startup
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
    finally:
        print("🧹 Cleaning up GPIO resources...")
        gpio_controller.cleanup()
        print("✅ Cleanup completed")


if __name__ == "__main__":
    main()
