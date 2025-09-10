import threading
import time
import logging

# Try to import RPi.GPIO, fall back to mock for development
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False
    print("RPi.GPIO not available, using mock GPIO for development")

class MockGPIO:
    """Mock GPIO for development environment"""
    BCM = "BCM"
    OUT = "OUT"
    HIGH = 1
    LOW = 0
    
    @staticmethod
    def setmode(mode):
        pass
    
    @staticmethod
    def setup(pin, mode):
        print(f"Mock GPIO: Setup pin {pin} as {mode}")
    
    @staticmethod
    def output(pin, state):
        state_str = "HIGH" if state else "LOW"
        print(f"Mock GPIO: Set pin {pin} to {state_str}")
    
    @staticmethod
    def cleanup():
        print("Mock GPIO: Cleanup")

class SimpleGPIOController:
    """Simplified GPIO controller for scent dispensers"""
    
    def __init__(self):
        self.gpio = GPIO if GPIO_AVAILABLE else MockGPIO()
        self.pin_mapping = {}
        self.active_formula = None
        self.active_thread = None
        self.stop_event = threading.Event()
        self.lock = threading.Lock()
        
        # Schedule management
        self.active_schedule = None
        self.schedule_end_time = None
        self.user_override = False
        
        # Setup GPIO mode
        if GPIO_AVAILABLE:
            self.gpio.setmode(self.gpio.BCM)
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def set_pin_mapping(self, mapping):
        """Set GPIO pin mapping for formulas"""
        self.pin_mapping = mapping
        
        # Setup all pins as output
        for color, pin in mapping.items():
            try:
                self.gpio.setup(pin, self.gpio.OUT)
                self.gpio.output(pin, self.gpio.LOW)
                self.logger.info(f"Initialized pin {pin} for {color} formula")
            except Exception as e:
                self.logger.error(f"Error setting up pin {pin} for {color}: {e}")
    
    def activate_formula(self, color, cycle_time=60, duration=10, is_scheduled=False, activation_duration=None):
        """Activate single formula with timing parameters"""
        with self.lock:
            try:
                # Deactivate any currently active formula
                self.deactivate_all()
                
                if color not in self.pin_mapping:
                    self.logger.error(f"Unknown formula color: {color}")
                    return False
                
                pin = self.pin_mapping[color]
                self.active_formula = color
                
                # Handle schedule vs user activation
                if is_scheduled:
                    self.active_schedule = color
                    if activation_duration:
                        self.schedule_end_time = time.time() + activation_duration
                    self.user_override = False
                    self.logger.info(f"Schedule activated: {color} (will run for {activation_duration}s)")
                else:
                    # User manual activation
                    if self.active_schedule:
                        self.user_override = True
                        self.logger.info(f"User override: switching from scheduled {self.active_schedule} to {color}")
                    else:
                        self.user_override = False
                
                # Stop any existing thread
                self.stop_event.set()
                if self.active_thread and self.active_thread.is_alive():
                    self.active_thread.join(timeout=1)
                
                # Start new activation thread
                self.stop_event.clear()
                self.active_thread = threading.Thread(
                    target=self._activation_cycle,
                    args=(pin, cycle_time, duration, color, is_scheduled, activation_duration)
                )
                self.active_thread.daemon = True
                self.active_thread.start()
                
                self.logger.info(f"Activated {color} formula on pin {pin} (cycle: {cycle_time}s, duration: {duration}s)")
                return True
                
            except Exception as e:
                self.logger.error(f"Error activating formula {color}: {e}")
                return False
    
    def _activation_cycle(self, pin, cycle_time, duration, color, is_scheduled=False, activation_duration=None):
        """Run the activation cycle in a separate thread"""
        try:
            start_time = time.time()
            
            while not self.stop_event.is_set():
                # Check if scheduled activation should end
                if is_scheduled and activation_duration and not self.user_override:
                    if time.time() - start_time >= activation_duration:
                        self.logger.info(f"Scheduled activation of {color} completed after {activation_duration}s")
                        break
                
                # Activate pin
                self.gpio.output(pin, self.gpio.HIGH)
                self.logger.debug(f"Pin {pin} ({color}) activated")
                
                # Wait for duration
                if self.stop_event.wait(duration):
                    break
                
                # Deactivate pin
                self.gpio.output(pin, self.gpio.LOW)
                self.logger.debug(f"Pin {pin} ({color}) deactivated")
                
                # Wait for rest of cycle
                remaining_time = cycle_time - duration
                if remaining_time > 0:
                    if self.stop_event.wait(remaining_time):
                        break
                else:
                    # If duration >= cycle_time, just wait a bit
                    if self.stop_event.wait(1):
                        break
                        
        except Exception as e:
            self.logger.error(f"Error in activation cycle for {color}: {e}")
        finally:
            # Ensure pin is off when thread ends
            try:
                self.gpio.output(pin, self.gpio.LOW)
            except:
                pass
            
            # Clear schedule state if this was a scheduled activation
            if is_scheduled and not self.user_override:
                self.active_schedule = None
                self.schedule_end_time = None
    
    def deactivate_all(self):
        """Deactivate all GPIO pins"""
        try:
            # Stop activation thread
            self.stop_event.set()
            if self.active_thread and self.active_thread.is_alive():
                self.active_thread.join(timeout=2)
            
            # Turn off all pins
            for color, pin in self.pin_mapping.items():
                try:
                    self.gpio.output(pin, self.gpio.LOW)
                except Exception as e:
                    self.logger.error(f"Error deactivating pin {pin} for {color}: {e}")
            
            # Clear all state
            self.active_formula = None
            self.active_schedule = None
            self.schedule_end_time = None
            self.user_override = False
            self.logger.info("All formulas deactivated")
            
        except Exception as e:
            self.logger.error(f"Error deactivating all formulas: {e}")
    
    def get_status(self):
        """Get current activation status"""
        return {
            'active_formula': self.active_formula,
            'active_schedule': self.active_schedule,
            'user_override': self.user_override,
            'schedule_end_time': self.schedule_end_time,
            'pin_mapping': self.pin_mapping,
            'gpio_available': GPIO_AVAILABLE
        }
    
    def cleanup(self):
        """Clean up GPIO resources"""
        try:
            self.deactivate_all()
            if GPIO_AVAILABLE:
                self.gpio.cleanup()
            self.logger.info("GPIO cleanup completed")
        except Exception as e:
            self.logger.error(f"Error during GPIO cleanup: {e}")