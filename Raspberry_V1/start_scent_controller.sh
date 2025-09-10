#!/bin/bash
# Startup script for Raspberry Pi Scent Controller

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="Scent Controller"
LOG_FILE="$SCRIPT_DIR/scent_controller.log"
PID_FILE="$SCRIPT_DIR/scent_controller.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check if running as root (needed for GPIO access)
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}Error: This script must be run as root for GPIO access${NC}"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Check if Python 3 is available
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: Python 3 is not installed${NC}"
        exit 1
    fi
    
    log "Python 3 found: $(python3 --version)"
}

# Install Python dependencies
install_dependencies() {
    log "Installing Python dependencies..."
    
    if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
        python3 -m pip install -r "$SCRIPT_DIR/requirements.txt" >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            log "Dependencies installed successfully"
        else
            echo -e "${RED}Error: Failed to install dependencies${NC}"
            exit 1
        fi
    else
        log "No requirements.txt found, skipping dependency installation"
    fi
}

# Check if application is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}$APP_NAME is already running (PID: $PID)${NC}"
            return 0
        else
            log "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Start the application
start_app() {
    log "Starting $APP_NAME..."
    
    cd "$SCRIPT_DIR"
    
    # Start the application in background
    nohup python3 app.py >> "$LOG_FILE" 2>&1 &
    APP_PID=$!
    
    # Save PID
    echo "$APP_PID" > "$PID_FILE"
    
    # Wait a moment and check if it's still running
    sleep 2
    if ps -p "$APP_PID" > /dev/null 2>&1; then
        log "$APP_NAME started successfully (PID: $APP_PID)"
        echo -e "${GREEN}$APP_NAME is now running on http://localhost:5000${NC}"
        echo -e "${GREEN}Access from other devices: http://$(hostname -I | awk '{print $1}'):5000${NC}"
        return 0
    else
        log "Failed to start $APP_NAME"
        echo -e "${RED}Error: Failed to start $APP_NAME${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Stop the application
stop_app() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            log "Stopping $APP_NAME (PID: $PID)..."
            kill "$PID"
            
            # Wait for graceful shutdown
            for i in {1..10}; do
                if ! ps -p "$PID" > /dev/null 2>&1; then
                    break
                fi
                sleep 1
            done
            
            # Force kill if still running
            if ps -p "$PID" > /dev/null 2>&1; then
                log "Force killing $APP_NAME..."
                kill -9 "$PID"
            fi
            
            rm -f "$PID_FILE"
            log "$APP_NAME stopped"
            echo -e "${GREEN}$APP_NAME stopped${NC}"
        else
            log "PID file exists but process not running, cleaning up"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}$APP_NAME is not running${NC}"
    fi
}

# Show application status
show_status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${GREEN}$APP_NAME is running (PID: $PID)${NC}"
            echo "Access URL: http://$(hostname -I | awk '{print $1}'):5000"
        else
            echo -e "${RED}$APP_NAME is not running (stale PID file)${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}$APP_NAME is not running${NC}"
    fi
}

# Show usage information
show_usage() {
    echo "Usage: $0 {start|stop|restart|status|install}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the Scent Controller application"
    echo "  stop     - Stop the Scent Controller application"
    echo "  restart  - Restart the Scent Controller application"
    echo "  status   - Show application status"
    echo "  install  - Install dependencies only"
    echo ""
    echo "Note: This script must be run as root for GPIO access"
}

# Main script logic
case "$1" in
    start)
        check_permissions
        check_python
        if ! check_running; then
            install_dependencies
            start_app
        fi
        ;;
    stop)
        check_permissions
        stop_app
        ;;
    restart)
        check_permissions
        check_python
        stop_app
        sleep 2
        install_dependencies
        start_app
        ;;
    status)
        show_status
        ;;
    install)
        check_permissions
        check_python
        install_dependencies
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

exit 0