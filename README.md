# Raspberry Pi Scent Controller V1

A sophisticated web-based scent dispenser controller with a fancy matte design aesthetic. Features circular formula selection, time-based scheduling, and elegant visual feedback.

## Features

### 🎨 Fancy Matte Design
- **Color Palette**: Sophisticated matte tones with white, cold grays, and black base
- **Formula Colors**: Crimson (red), Azure (blue), Amber (yellow), Sage (green)
- **Visual Effects**: Smooth animations, ripple effects, and elegant hover states
- **Responsive**: Works beautifully on desktop and mobile devices

### 🔘 Circular Selection Interface
- **Intuitive Layout**: Four formula buttons arranged in a perfect circle
- **Center Control**: OFF button positioned in the center for easy access
- **Visual Feedback**: Selected formulas glow with mint accent and pulse animation
- **Configuration Bar**: Easy-to-use cycle time and duration controls

### ⏰ Smart Scheduling
- **Time-Based Activation**: Schedule formulas to activate at specific times
- **Flexible Parameters**: Configure cycle time (10s-180s) and duration (5s-10s)
- **Schedule Management**: Add, view, and delete scheduled activations
- **Insights Panel**: Analytics showing usage patterns and next activations

### 🎛️ Advanced Controls
- **Single Formula Mode**: Only one formula active at a time for safety
- **Real-time Status**: Live status indicator showing current activation state
- **Keyboard Shortcuts**: Quick access via keyboard (R/1, B/2, Y/3, G/4, O/0)
- **Error Handling**: Graceful error handling with user-friendly notifications

## Installation

### Prerequisites
- Raspberry Pi with GPIO pins
- Python 3.7+
- pip package manager

### Setup

1. **Clone or download the project**
   ```bash
   cd Raspberry_V1
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   # Create virtual environment
   python -m venv .venv
   
   # Activate virtual environment
   # On Linux/Mac:
   source .venv/bin/activate
   
   # On Windows:
   .venv\Scripts\activate
   ```
   
   ⚠️ **Important**: Make sure the virtual environment is activated before installing packages!
   You should see `(.venv)` at the beginning of your command prompt.

3. **Install Python dependencies**
   ```bash
   # Make sure virtual environment is activated first!
   pip install -r requirements.txt
   ```

4. **Configure GPIO pins (optional)**
   Edit `pin_mapping.json` to customize GPIO pin assignments:
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

5. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the web interface**
   Open your browser to `http://localhost:5000` or `http://[raspberry-pi-ip]:5000`

## Usage

### Selection Interface
1. **Navigate to the main page** - Displays the circular formula selection interface
2. **Configure timing** - Use the configuration bar to set cycle time and duration
3. **Select formula** - Click any of the four formula buttons (Crimson, Azure, Amber, Sage)
4. **Monitor status** - Watch the status indicator for real-time feedback
5. **Deactivate** - Click the center OFF button to stop all formulas

### Scheduling Interface
1. **Navigate to Schedule page** - Click "Schedule" in the navigation
2. **Add new schedule** - Click "Add Schedule" button
3. **Configure schedule** - Set time, formula, cycle time, and duration
4. **View schedules** - All scheduled activations are listed with details
5. **Delete schedules** - Click the × button to remove unwanted schedules

### Keyboard Shortcuts
- **R or 1**: Activate Crimson (red) formula
- **B or 2**: Activate Azure (blue) formula  
- **Y or 3**: Activate Amber (yellow) formula
- **G or 4**: Activate Sage (green) formula
- **O or 0**: Turn off all formulas
- **Escape**: Close modals or deactivate

## Configuration Files

### pin_mapping.json
Defines GPIO pin assignments for each formula. The system uses these pins to control scent dispensers:

```json
{
  "formulas": {
    "red": 18,     # GPIO pin for Crimson formula dispenser
    "blue": 19,    # GPIO pin for Azure formula dispenser  
    "yellow": 20,  # GPIO pin for Amber formula dispenser
    "green": 21    # GPIO pin for Sage formula dispenser
  }
}
```

**Default Pins**: If this file is missing, the system uses pins 18, 19, 20, 21 for red, blue, yellow, green respectively.

**Customization**: Modify pin numbers to match your hardware setup. Ensure pins support output mode and don't conflict with other Raspberry Pi functions.

### schedules.json
Stores scheduled activations (managed automatically):
```json
{
  "schedules": [
    {
      "id": 1,
      "time": "09:00",
      "formula": "red",
      "cycle_time": 60,
      "duration": 10,
      "enabled": true
    }
  ]
}
```

## API Endpoints

### Formula Control
- `POST /api/activate` - Activate formula with timing parameters
- `POST /api/deactivate` - Deactivate all formulas
- `GET /api/status` - Get current activation status

### Schedule Management
- `GET /api/schedules` - Retrieve all schedules
- `POST /api/schedules` - Create new schedule
- `DELETE /api/schedules/<id>` - Delete specific schedule

## Development

### Mock GPIO Mode
The application automatically detects if RPi.GPIO is available. If not, it runs in mock mode for development:
```python
# Mock GPIO output will be printed to console
Mock GPIO: Setup pin 18 as OUT
Mock GPIO: Set pin 18 to HIGH
```

### File Structure
```
├── .gitignore             # Git ignore patterns  
├── .venv/                 # Virtual environment (created by setup)
├── app.py                 # Flask application
├── gpio_controller.py     # GPIO control logic
├── pin_mapping.json       # GPIO pin configuration
├── schedules.json         # Schedule storage
├── requirements.txt       # Python dependencies
├── README.md             # This documentation
├── templates/
│   ├── base.html         # Base template
│   ├── selection.html    # Main selection interface
│   └── schedule.html     # Schedule management
└── static/
    ├── css/
    │   └── style.css     # Fancy matte styling
    └── js/
        ├── app.js        # Global utilities
        ├── selection.js  # Selection page logic
        └── schedule.js   # Schedule page logic
```

## Technical Architecture

### System Overview
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

### Key Design Principles

#### Single Formula Mode
- **Exclusive Control**: Only one formula can be active at any time for safety
- **Automatic Deactivation**: Selecting a new formula automatically deactivates the current one
- **Conflict Prevention**: Manual activation overrides scheduled operations

#### GPIO Management
- **Mock Mode**: Automatically detects Raspberry Pi GPIO availability
- **Development Support**: Runs on Windows/Mac with console output simulation  
- **Error Resilience**: Graceful handling of GPIO errors and hardware issues
- **Clean Shutdown**: Proper GPIO cleanup on application termination

#### Configuration-Driven
- **Pin Mapping**: GPIO pins configurable via `pin_mapping.json`
- **Schedule Storage**: Persistent schedules in `schedules.json`
- **Default Fallbacks**: System continues with defaults if config files are missing
- **Runtime Updates**: Configuration changes applied without restart

#### Web Interface Design
- **Circular Layout**: Intuitive radial button arrangement for formula selection
- **Visual Feedback**: Real-time status updates and selection highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Quick access via keyboard for power users

## Safety Features

- **Single Formula Mode**: Only one formula can be active at a time
- **GPIO Cleanup**: Proper cleanup on application shutdown
- **Error Handling**: Graceful handling of GPIO and configuration errors
- **Input Validation**: All user inputs are validated before processing
- **Conflict Detection**: Schedule conflicts are detected and reported

## Customization

### Color Themes
Modify CSS variables in `static/css/style.css`:
```css
:root {
    --matte-red: #c5554a;
    --matte-blue: #4a90c5;
    --matte-yellow: #c5a54a;
    --matte-green: #6b9b6b;
    /* ... other colors */
}
```

### Formula Names
Update formula display names in `static/js/app.js`:
```javascript
function getFormulaDisplayName(color) {
    const names = {
        red: 'Crimson',
        blue: 'Azure',
        yellow: 'Amber',
        green: 'Sage'
    };
    return names[color] || color;
}
```

## Troubleshooting

### Common Issues

#### 1. ModuleNotFoundError: No module named 'flask'
**Symptoms**: `ModuleNotFoundError: No module named 'flask'` when running `python app.py`
**Solution**: 
```bash
# Activate virtual environment first
# On Windows:
.venv\Scripts\activate

# On Linux/Mac:
source .venv/bin/activate

# Then install requirements
pip install -r requirements.txt

# Now run the app
python app.py
```

#### 2. Connection Error / Buttons Not Working
**Symptoms**: "Connection Error" message, buttons show error when pressed
**Solution**: 
```bash
# Start the server first
python app.py
# Or use the startup script
python start_server.py
# Or test if server is running
python test_server.py
```

#### 2. Buttons Moving Around After Clicking
**Fixed**: This issue has been resolved with improved CSS positioning. Buttons now stay in their exact positions.

#### 3. GPIO Permission Error
**Solution**: Run with `sudo` or add user to gpio group:
```bash
sudo usermod -a -G gpio $USER
# Then logout and login again
```

#### 4. Port Already in Use
**Solution**: Change port in `app.py` or kill existing process:
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill the process
sudo kill -9 <PID>
```

#### 5. Configuration Not Loading
**Solution**: Check JSON file syntax and permissions:
```bash
# Validate JSON syntax
python -m json.tool pin_mapping.json
python -m json.tool schedules.json
```

#### 6. Schedule Not Activating
**Solution**: Verify system time and schedule format:
```bash
# Check system time
date
# Ensure schedules.json has correct time format (HH:MM)
```

### Testing Tools

#### Server Test
```bash
python test_server.py
```
This will check if the server is running and test API endpoints.

#### Easy Startup
```bash
python start_server.py
```
This will check dependencies and start the server with helpful messages.

### Logs
Application logs are printed to console. For production, configure proper logging:
```python
import logging
logging.basicConfig(level=logging.INFO, filename='scent_controller.log')
```

### Browser Console
If you're having issues with the web interface:
1. Open browser developer tools (F12)
2. Check the Console tab for JavaScript errors
3. Check the Network tab for failed API requests

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.