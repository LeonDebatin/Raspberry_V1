# Design Document

## Overview

The Raspberry Pi Scent Controller V1 is a simplified web-based application that provides intuitive control over four scent dispensers through GPIO pins. The system consists of two main interfaces: a circular selection menu for immediate control and a scheduling interface for automated time-based activation. The application is built using Flask for the web framework and leverages the existing GPIO controller patterns from the current project while significantly simplifying the user interface and functionality.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│  Flask Web App  │◄──►│ GPIO Controller │
│                 │    │                 │    │                 │
│ - Selection UI  │    │ - Route Handler │    │ - Pin Control   │
│ - Schedule UI   │    │ - JSON Config   │    │ - Timing Logic  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Configuration   │
                       │ Files           │
                       │ - pin_mapping   │
                       │ - schedules     │
                       └─────────────────┘
```

### Technology Stack

- **Backend**: Flask (Python web framework)
- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **GPIO Control**: RPi.GPIO library with mock fallback for development
- **Configuration**: JSON files for pin mapping and schedules
- **Styling**: CSS Grid and Flexbox for circular layout

## Components and Interfaces

### 1. Flask Application (`app.py`)

**Core Routes:**
- `GET /` - Selection menu page
- `GET /schedule` - Time scheduling page
- `POST /api/activate` - Activate formula with configuration
- `POST /api/deactivate` - Deactivate all formulas
- `GET /api/schedules` - Get all scheduled items
- `POST /api/schedules` - Create new scheduled item
- `DELETE /api/schedules/<id>` - Delete scheduled item

**Configuration Loading:**
```python
def load_pin_mapping():
    """Load GPIO pin mapping from JSON file"""
    # Default mapping: red=18, blue=19, yellow=20, green=21
    
def load_schedules():
    """Load scheduled items from JSON file"""
```

### 2. GPIO Controller (`gpio_controller.py`)

**Simplified Interface:**
```python
class SimpleGPIOController:
    def activate_formula(self, color, cycle_time, duration):
        """Activate single formula with timing parameters"""
        
    def deactivate_all(self):
        """Deactivate all GPIO pins"""
        
    def get_status(self):
        """Get current activation status"""
```

**Key Differences from Current System:**
- Only one formula active at a time
- Simplified timing logic (cycle + duration only)
- No complex scheduling threads
- Direct pin control without database persistence

### 3. Web Interface Components

#### Selection Menu (`templates/selection.html`)

**Circular Layout Structure:**
```html
<div class="selection-container">
    <div class="formula-circle">
        <button class="formula-btn red" data-color="red">Red</button>
        <button class="formula-btn blue" data-color="blue">Blue</button>
        <button class="formula-btn yellow" data-color="yellow">Yellow</button>
        <button class="formula-btn green" data-color="green">Green</button>
        <button class="off-btn">OFF</button>
    </div>
    <div class="config-bar">
        <div class="cycle-time-selector">...</div>
        <div class="duration-selector">...</div>
    </div>
</div>
```

**CSS Grid Layout:**
```css
.formula-circle {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 300px;
    height: 300px;
    border-radius: 50%;
}

.formula-btn.selected {
    border: 3px solid #00ff00;
}
```

#### Schedule Interface (`templates/schedule.html`)

**Multi-View Calendar System:**
```html
<div class="schedule-container">
    <div class="schedule-header">
        <div class="view-selector">
            <button class="view-btn" data-view="daily">Daily</button>
            <button class="view-btn" data-view="weekly">Weekly</button>
            <button class="view-btn" data-view="monthly">Monthly</button>
        </div>
        <button id="add-schedule-btn">Add Schedule</button>
    </div>
    
    <div class="calendar-navigation">
        <button id="prev-period">&lt;</button>
        <span id="current-period-text">Today</span>
        <button id="next-period">&gt;</button>
        <button id="today-btn">Today</button>
    </div>
    
    <div class="calendar-container">
        <div id="daily-view" class="calendar-view">
            <div class="time-grid">
                <div class="time-labels"></div>
                <div class="time-slots"></div>
            </div>
        </div>
        
        <div id="weekly-view" class="calendar-view">
            <div class="week-header">...</div>
            <div class="week-grid"></div>
        </div>
        
        <div id="monthly-view" class="calendar-view">
            <div class="month-header">...</div>
            <div class="month-grid"></div>
        </div>
    </div>
    
    <div id="schedule-modal" class="modal">
        <!-- Schedule creation/editing form -->
    </div>
</div>
```

**Calendar View Components:**

1. **Daily View**: 24-hour timeline with clickable time slots
2. **Weekly View**: 7-day grid with hour rows and day columns
3. **Monthly View**: Traditional calendar with date cells showing schedule events
4. **Navigation**: Previous/Next buttons and Today button for each view
5. **Modal Form**: Comprehensive schedule creation with start/end times, recurrence patterns

## Data Models

### Pin Mapping Configuration (`pin_mapping.json`)

```json
{
    "formulas": {
        "red": 18,
        "blue": 19,
        "yellow": 20,
        "green": 21
    }
}
```

### Schedule Configuration (`schedules.json`)

```json
{
    "schedules": [
        {
            "id": 1,
            "start_time": "09:00",
            "end_time": "10:30",
            "formula": "red",
            "cycle_time": 60,
            "duration": 10,
            "recurrence": "daily",
            "enabled": true
        },
        {
            "id": 2,
            "start_time": "14:00",
            "end_time": "15:00",
            "formula": "blue",
            "cycle_time": 120,
            "duration": 5,
            "recurrence": "weekdays",
            "enabled": true
        }
    ]
}
```

### Application State

```javascript
// Frontend state management
const appState = {
    selectedFormula: null,
    cycleTime: 60,  // seconds
    duration: 10,   // seconds
    isActive: false,
    schedules: [],
    currentView: 'daily',  // daily, weekly, monthly
    currentDate: new Date(),
    editingSchedule: null
};

// Calendar view management
const calendarState = {
    dailyView: {
        timeSlots: [],
        scheduleEvents: []
    },
    weeklyView: {
        weekStart: null,
        daySlots: [],
        scheduleIndicators: []
    },
    monthlyView: {
        monthStart: null,
        dateElements: [],
        scheduleEvents: []
    }
};
```

## Error Handling

### GPIO Errors
- **Pin Access Failure**: Log error, show user notification, continue with other functionality
- **Invalid Pin Configuration**: Fall back to default pin mapping
- **Hardware Disconnection**: Graceful degradation with mock GPIO

### Configuration Errors
- **Missing JSON Files**: Create default configurations automatically
- **Invalid JSON Format**: Log error, use default values, notify user
- **File Permission Issues**: Show clear error message with resolution steps

### Web Interface Errors
- **AJAX Request Failures**: Show user-friendly error messages
- **Invalid User Input**: Client-side validation with clear feedback
- **Network Connectivity**: Offline-capable interface with local state management

## Testing Strategy

### Unit Tests

**GPIO Controller Tests:**
```python
def test_activate_single_formula():
    """Test activating one formula deactivates others"""
    
def test_timing_parameters():
    """Test cycle time and duration settings"""
    
def test_pin_mapping_loading():
    """Test loading and fallback of pin configurations"""
```

**Flask Route Tests:**
```python
def test_selection_page_loads():
    """Test main selection page renders correctly"""
    
def test_api_activate_formula():
    """Test formula activation API endpoint"""
    
def test_schedule_management():
    """Test schedule CRUD operations"""
```

### Integration Tests

**End-to-End Workflow:**
1. Load selection page
2. Configure timing parameters
3. Activate formula
4. Verify GPIO pin state
5. Deactivate and verify cleanup

**Schedule Integration:**
1. Create scheduled item
2. Verify time-based activation
3. Test schedule persistence
4. Test schedule modification/deletion

### Hardware Testing

**GPIO Pin Verification:**
- Test with actual Raspberry Pi hardware
- Verify pin state changes with multimeter
- Test timing accuracy with oscilloscope
- Validate safe shutdown procedures

**Mock Development Environment:**
- Ensure full functionality without hardware
- Test error handling for missing GPIO
- Validate development workflow

## Implementation Notes

### Simplified Architecture Benefits
- **Reduced Complexity**: Single formula activation eliminates conflict management
- **Faster Development**: Minimal database requirements, JSON-based configuration
- **Easier Maintenance**: Clear separation of concerns, simple state management
- **Better UX**: Intuitive circular interface, immediate visual feedback

### Migration from Current System
- **Reuse GPIO Controller**: Adapt existing GPIO management patterns
- **Simplify Database**: Replace SQLite with JSON files for configuration
- **Streamline UI**: Focus on essential functionality only
- **Maintain Safety**: Keep existing GPIO cleanup and error handling patterns