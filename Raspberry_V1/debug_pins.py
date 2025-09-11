#!/usr/bin/env python3
"""
Debug script to test individual GPIO pins
Run this to verify which physical pin activates when you trigger each formula
"""

import time
import sys

# Try to import RPi.GPIO
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
    print("✓ RPi.GPIO available - running on Raspberry Pi")
except ImportError:
    GPIO_AVAILABLE = False
    print("✗ RPi.GPIO not available - running in mock mode")
    print("This script needs to run on the actual Raspberry Pi to test hardware")
    sys.exit(1)

# Pin mapping from your config
PIN_MAPPING = {
    "yellow": 18,
    "green": 19, 
    "red": 20,
    "blue": 21
}

def setup_gpio():
    """Initialize GPIO pins"""
    GPIO.setmode(GPIO.BCM)
    
    for color, pin in PIN_MAPPING.items():
        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, GPIO.LOW)
        print(f"✓ Setup pin {pin} for {color}")

def test_pin(color, pin, duration=3):
    """Test a specific pin"""
    print(f"\n🔴 Testing {color.upper()} - GPIO pin {pin}")
    print(f"   Watch your hardware - this pin should activate for {duration} seconds")
    print("   Press Ctrl+C to stop if needed")
    
    try:
        GPIO.output(pin, GPIO.HIGH)
        print(f"   ⚡ Pin {pin} is now HIGH (active)")
        
        for i in range(duration):
            print(f"   ⏱️  {duration - i} seconds remaining...")
            time.sleep(1)
        
        GPIO.output(pin, GPIO.LOW)
        print(f"   ⚫ Pin {pin} is now LOW (inactive)")
        
    except KeyboardInterrupt:
        GPIO.output(pin, GPIO.LOW)
        print(f"\n   ⚫ Pin {pin} turned off (interrupted)")

def cleanup():
    """Clean up GPIO"""
    try:
        for pin in PIN_MAPPING.values():
            GPIO.output(pin, GPIO.LOW)
        GPIO.cleanup()
        print("\n✓ GPIO cleanup completed")
    except:
        pass

def main():
    if not GPIO_AVAILABLE:
        return
    
    print("🧪 GPIO Pin Debug Tool")
    print("=" * 40)
    print("This will test each GPIO pin individually")
    print("Watch your connected hardware to see which device activates")
    print()
    
    try:
        setup_gpio()
        
        while True:
            print("\n" + "=" * 40)
            print("Select a pin to test:")
            print("1. Yellow (GPIO 18)")
            print("2. Green  (GPIO 19)")  
            print("3. Red    (GPIO 20)")
            print("4. Blue   (GPIO 21)")
            print("5. Test all pins in sequence")
            print("0. Exit")
            
            choice = input("\nEnter choice (0-5): ").strip()
            
            if choice == "0":
                break
            elif choice == "1":
                test_pin("yellow", PIN_MAPPING["yellow"])
            elif choice == "2":
                test_pin("green", PIN_MAPPING["green"])
            elif choice == "3":
                test_pin("red", PIN_MAPPING["red"])
            elif choice == "4":
                test_pin("blue", PIN_MAPPING["blue"])
            elif choice == "5":
                print("\n🔄 Testing all pins in sequence...")
                for color, pin in PIN_MAPPING.items():
                    test_pin(color, pin, 2)
                    time.sleep(1)
            else:
                print("❌ Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        cleanup()

if __name__ == "__main__":
    main()