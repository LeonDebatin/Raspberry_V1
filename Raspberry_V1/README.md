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

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure GPIO pins (optional)**
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

4. **Run the application**
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
Defines GPIO pin assignments for each formula:
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
Raspberry_V1/
├── app.py                 # Flask application
├── gpio_controller.py     # GPIO control logic
├── pin_mapping.json       # GPIO pin configuration
├── schedules.json         # Schedule storage
├── requirements.txt       # Python dependencies
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
1. **GPIO Permission Error**: Run with `sudo` or add user to gpio group
2. **Port Already in Use**: Change port in `app.py` or kill existing process
3. **Configuration Not Loading**: Check JSON file syntax and permissions
4. **Schedule Not Activating**: Verify system time and schedule format

### Logs
Application logs are printed to console. For production, configure proper logging:
```python
import logging
logging.basicConfig(level=logging.INFO, filename='scent_controller.log')
```

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.