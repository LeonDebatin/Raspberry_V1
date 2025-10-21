import threading
import time
import logging

# Try to import RPi.GPIO, fall back to mock for development
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False
    # Using mock GPIO for development (silent mode)

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
        pass  # Removed debug print
    
    @staticmethod
    def output(pin, state):
        pass  # Removed debug print - GPIO operations are silent now
    
    @staticmethod
    def cleanup():
        pass  # Removed debug print

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
        
        # Cycle timing for frontend synchronization
        self.cycle_start_time = None
        self.current_cycle_time = None
        self.current_duration = None
        
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
        try:
            # Deactivate any currently active formula (preserve user override if this is a manual activation)
            self._deactivate_all_internal(clear_user_override=is_scheduled)
            
            with self.lock:
                if color not in self.pin_mapping:
                    self.logger.error(f"Unknown formula color: {color}")
                    return False
                
                pin = self.pin_mapping[color]
                self.active_formula = color
                
                # Track cycle timing for frontend synchronization
                # Note: cycle_start_time will be set in the thread right before GPIO fires
                self.cycle_start_time = None  # Will be set when cycle actually starts
                self.current_cycle_time = cycle_time
                self.current_duration = duration
                
                # Handle schedule vs user activation
                if is_scheduled:
                    self.active_schedule = color
                    if activation_duration:
                        self.schedule_end_time = time.time() + activation_duration
                    # Don't change user_override if it's already True (preserve user override state)
                    if not self.user_override:
                        self.user_override = False
                    self.logger.info(f"Schedule activated: {color} (will run for {activation_duration}s)")
                else:
                    # User manual activation
                    previous_schedule = self.active_schedule
                    self.active_schedule = None  # Clear any active schedule
                    self.schedule_end_time = None
                    self.user_override = True  # Always set user override for manual activations
                    if previous_schedule:
                        self.logger.info(f"User override: switching from scheduled {previous_schedule} to {color}")
                    else:
                        self.logger.info(f"User manual activation: {color}")
                
                # Stop any existing thread
                self.stop_event.set()
                if self.active_thread and self.active_thread.is_alive():
                    self.active_thread.join(timeout=0.1)  # Reduced timeout for faster response
                
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
            # Set cycle_start_time once at the very beginning, right before the first GPIO fires
            # This is the anchor point for all cycle calculations
            with self.lock:
                self.cycle_start_time = time.time()
            self.logger.info(f"Cycle timing initialized at {self.cycle_start_time} for {color}")
            
            start_time = self.cycle_start_time
            
            while not self.stop_event.is_set():
                # Check if scheduled activation should end (only for scheduled activations with duration)
                if is_scheduled and activation_duration is not None and not self.user_override:
                    if time.time() - start_time >= activation_duration:
                        self.logger.info(f"Scheduled activation of {color} completed after {activation_duration}s")
                        break
                
                # Activate pin (aligned with cycle_start_time)
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
            
            # Clear schedule state if this was a scheduled activation that completed naturally
            if is_scheduled and not self.user_override:
                with self.lock:
                    self.active_formula = None
                    self.active_schedule = None
                    self.schedule_end_time = None
                    self.logger.info(f"Scheduled activation of {color} fully completed and cleared")
    
    def _deactivate_all_internal(self, clear_user_override=True):
        """Internal deactivate method without locking (for use within locked contexts)"""
        try:
            # Stop activation thread
            self.stop_event.set()
            if self.active_thread and self.active_thread.is_alive():
                self.active_thread.join(timeout=0.1)  # Reduced timeout for faster response
            
            # Turn off all pins
            for color, pin in self.pin_mapping.items():
                try:
                    self.gpio.output(pin, self.gpio.LOW)
                except Exception as e:
                    self.logger.error(f"Error deactivating pin {pin} for {color}: {e}")
            
            # Clear state
            self.active_formula = None
            self.active_schedule = None
            self.schedule_end_time = None
            if clear_user_override:
                self.user_override = False
            
            # Clear cycle timing
            self.cycle_start_time = None
            self.current_cycle_time = None
            self.current_duration = None
            
            self.logger.info("All formulas deactivated")
            
        except Exception as e:
            self.logger.error(f"Error deactivating all formulas: {e}")

    def deactivate_all(self):
        """Deactivate all GPIO pins"""
        with self.lock:
            self._deactivate_all_internal()
    
    def clear_user_override(self):
        """Clear user override flag to allow schedules to resume"""
        with self.lock:
            self.user_override = False
            self.logger.info("User override cleared - schedules can resume")
    
    def force_schedule_transition(self, new_formula, cycle_time, duration, activation_duration):
        """Force a transition to a new scheduled formula, clearing any user override"""
        with self.lock:
            # Clear user override for session transition
            if self.user_override:
                self.logger.info("Forcing schedule transition - clearing user override")
                self.user_override = False
            
            # Activate the new scheduled formula
            return self.activate_formula(
                new_formula, 
                cycle_time, 
                duration, 
                is_scheduled=True, 
                activation_duration=activation_duration
            )
    
    def get_status(self):
        """Get current activation status"""
        return {
            'active': bool(self.active_formula),  # Add active flag
            'active_formula': self.active_formula,
            'active_schedule': self.active_schedule,
            'is_scheduled': bool(self.active_schedule and not self.user_override),  # Add is_scheduled flag
            'user_override': self.user_override,
            'schedule_end_time': self.schedule_end_time,
            'pin_mapping': self.pin_mapping,
            'gpio_available': GPIO_AVAILABLE,
            # Cycle timing for frontend synchronization
            'cycle_start_time': self.cycle_start_time,
            'current_cycle_time': self.current_cycle_time,
            'current_duration': self.current_duration
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