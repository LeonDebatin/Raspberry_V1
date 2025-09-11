// Selection page functionality

class SelectionController {
    constructor() {
        this.selectedFormula = null;
        this.cycleTime = 60;
        this.duration = 10;
        this.isActive = false;
        
        // Configuration: Set to true to use page reload instead of position reset
        this.usePageReload = false; // Change to true if position reset doesn't work
        
        this.initializeElements();
        this.bindEvents();
        this.updateConfigButtons(); // Set initial button states
        this.loadStatus();
    }
    
    initializeElements() {
        this.formulaBtns = document.querySelectorAll('.dot');
        this.offBtn = document.getElementById('off-btn');
        this.configBtns = document.querySelectorAll('.config-btn');
        this.statusText = document.getElementById('status-text');
        this.statusDot = document.getElementById('status-dot');
        
        // Progress circle elements
        this.progressContainer = document.getElementById('progress-circle-container');
        this.progressCycle = document.getElementById('progress-cycle');
        this.progressIndicator = document.getElementById('progress-indicator');
        
        // Progress circle state
        this.scheduleStartTime = null;
        this.scheduleDuration = null;
        this.cycleStartTime = null;
        this.animationFrame = null;
        this.arcInitialized = false;
        this.lastCycleProgress = 0; // Track for debugging jumps
    }
    
    bindEvents() {
        // Formula button clicks
        this.formulaBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.selectFormula(color);
            });
        });
        
        // Off button click
        if (this.offBtn) {
            this.offBtn.addEventListener('click', () => {
                this.deactivateAll();
            });
        }
        
        // Configuration button clicks
        this.configBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cycleTime = e.currentTarget.dataset.cycle;
                const duration = e.currentTarget.dataset.duration;
                
                if (cycleTime) {
                    this.setCycleTime(parseInt(cycleTime));
                }
                
                if (duration) {
                    this.setDuration(parseInt(duration));
                }
                
                this.updateConfigButtons();
            });
        });
    }
    
    async selectFormula(color) {
        try {
            this.updateStatus('Activating...', false);
            
            const response = await window.api.post('/api/activate', {
                color: color,
                cycle_time: this.cycleTime,
                duration: this.duration
            });
            
            this.selectedFormula = color;
            this.isActive = true;
            
            this.updateFormulaButtons();
            this.updateStatus(`${getFormulaDisplayName(color)} Active`, true);
            
            // Start progress circle for manual activation
            this.startProgressCircle(color, false);
            
            window.notifications.success(
                `${getFormulaDisplayName(color)} formula activated (${this.cycleTime}s cycle, ${this.duration}s duration)`
            );
            
        } catch (error) {
            console.error('Error activating formula:', error);
            this.updateStatus('Connection Error', false);
            
            // Check if it's a network error
            if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                window.notifications.error('Connection Error: Cannot reach the scent controller. Please check if the server is running.');
            } else {
                window.notifications.error(`Failed to activate formula: ${error.message}`);
            }
        }
    }
    
    async deactivateAll() {
        try {
            this.updateStatus('Deactivating...', false);
            
            await window.api.post('/api/deactivate', {});
            
            this.selectedFormula = null;
            this.isActive = false;
            
            this.updateFormulaButtons();
            this.updateStatus('Ready', false);
            
            // Stop progress circle
            this.stopProgressCircle();
            
            window.notifications.success('All formulas deactivated');
            
        } catch (error) {
            console.error('Error deactivating formulas:', error);
            this.updateStatus('Connection Error', false);
            
            // Check if it's a network error
            if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                window.notifications.error('Connection Error: Cannot reach the scent controller. Please check if the server is running.');
            } else {
                window.notifications.error(`Failed to deactivate formulas: ${error.message}`);
            }
        }
    }
    
    setCycleTime(time) {
        this.cycleTime = time;
        
        // If currently active, restart the cycle with new settings (ball jumps to start)
        if (this.isActive && this.selectedFormula) {
            // Update the progress circle immediately with new timing
            this.updateProgressCircleTiming();
            // Reactivate with new settings - this will reset the cycle timing
            this.reactivateWithNewSettings();
        }
    }
    
    setDuration(time) {
        this.duration = time;
        
        // If currently active, restart the cycle with new settings (ball jumps to start)
        if (this.isActive && this.selectedFormula) {
            // Update the progress circle immediately with new timing
            this.updateProgressCircleTiming();
            // Reactivate with new settings - this will reset the cycle timing
            this.reactivateWithNewSettings();
        }
    }
    
    updateFormulaButtons() {
        this.formulaBtns.forEach(btn => {
            const color = btn.dataset.color;
            if (color === this.selectedFormula && this.isActive) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
    
    updateConfigButtons() {
        this.configBtns.forEach(btn => {
            const cycleTime = btn.dataset.cycle;
            const duration = btn.dataset.duration;
            
            btn.classList.remove('active');
            
            if (cycleTime && parseInt(cycleTime) === this.cycleTime) {
                btn.classList.add('active');
            }
            
            if (duration && parseInt(duration) === this.duration) {
                btn.classList.add('active');
            }
        });
    }
    
    updateStatus(text, active) {
        if (this.statusText) {
            this.statusText.textContent = text;
        }
        
        if (this.statusDot) {
            if (active) {
                this.statusDot.classList.add('active');
            } else {
                this.statusDot.classList.remove('active');
            }
        }
    }
    
    async loadStatus() {
        try {
            const status = await window.api.get('/api/status');
            
            if (status.active_formula) {
                this.selectedFormula = status.active_formula;
                this.isActive = true;
                this.updateFormulaButtons();
                this.updateStatus(`${getFormulaDisplayName(status.active_formula)} Active`, true);
                
                // Update progress circle based on status
                this.updateProgressFromStatus(status);
            } else {
                this.selectedFormula = null;
                this.isActive = false;
                this.updateStatus('Ready', false);
                
                // Stop progress circle
                this.stopProgressCircle();
            }
            
        } catch (error) {
            console.error('Error loading status:', error);
            this.updateStatus('Connection Error', false);
            
            // Show helpful error message
            if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                window.notifications.error('Cannot connect to scent controller. Please start the server by running: python app.py', 8000);
            }
        }
    }
    
    // Auto-refresh status every 30 seconds
    startStatusPolling() {
        setInterval(() => {
            this.loadStatus();
        }, 30000);
    }
    
    // Progress Circle Methods
    startProgressCircle(formula, isScheduled = false, scheduleDuration = null, preserveCycleTime = false) {
        if (!this.progressContainer) return;
        
        // Prevent multiple simultaneous starts
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Set formula color
        this.progressContainer.className = `progress-circle-container active formula-${formula}`;
        
        // Store timing information
        this.scheduleStartTime = Date.now();
        this.scheduleDuration = scheduleDuration;
        
        // Only reset cycle start time if not preserving (i.e., for new activations)
        if (!preserveCycleTime || !this.cycleStartTime) {
            this.cycleStartTime = Date.now();
        }
        
        // Reset arc initialization to ensure it gets recalculated
        this.arcInitialized = false;
        
        // Start cycle animation
        this.startCycleAnimation();
    }
    
    startCycleAnimation() {
        if (!this.progressIndicator) return;
        
        // Calculate cycle duration in milliseconds
        const cycleDurationMs = this.cycleTime * 1000;
        
        // Position the ball on the circle and start rotation
        this.positionIndicatorBall();
        
        // Update cycle progress indicator
        this.updateCycleProgress();
    }
    
    positionIndicatorBall() {
        if (!this.progressIndicator || !this.progressContainer) return;
        
        // Get actual container size (responsive)
        const containerRect = this.progressContainer.getBoundingClientRect();
        const containerSize = containerRect.width;
        const radius = 85 * (containerSize / 200); // Scale radius to container
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        
        // Position ball at top of circle initially (12 o'clock position)
        const ballX = centerX;
        const ballY = centerY - radius;
        
        this.progressIndicator.style.left = `${ballX}px`;
        this.progressIndicator.style.top = `${ballY}px`;
        this.progressIndicator.style.transform = 'translate(-50%, -50%)';
    }
    
    updateCycleProgress() {
        if (!this.progressCycle || !this.isActive || !this.cycleStartTime || this.cycleTime <= 0) return;
        
        const now = Date.now();
        const cycleElapsed = (now - this.cycleStartTime) % (this.cycleTime * 1000);
        let cycleProgress = cycleElapsed / (this.cycleTime * 1000);
        
        // Validate cycleProgress to prevent NaN or invalid values
        if (isNaN(cycleProgress) || !isFinite(cycleProgress)) {
            console.warn('Invalid cycle progress calculated, resetting cycle start time');
            this.cycleStartTime = Date.now();
            cycleProgress = 0;
        }
        
        // Ensure progress is within bounds [0, 1]
        cycleProgress = Math.max(0, Math.min(1, cycleProgress));
        
        // Debug: Check for unexpected jumps
        if (this.lastCycleProgress > 0.8 && cycleProgress < 0.2) {
            // Normal cycle completion, not a jump
        } else if (Math.abs(cycleProgress - this.lastCycleProgress) > 0.5 && this.lastCycleProgress > 0) {
            console.warn('Detected potential ball jump:', {
                from: this.lastCycleProgress,
                to: cycleProgress,
                cycleStartTime: this.cycleStartTime,
                now: Date.now(),
                cycleTime: this.cycleTime
            });
        }
        this.lastCycleProgress = cycleProgress;
        
        // Set up the static colored arc (only once, not every frame)
        if (!this.arcInitialized) {
            this.setupStaticArc();
            this.arcInitialized = true;
        }
        
        // Only update ball position (arc stays static)
        this.updateBallPosition(cycleProgress);
        
        // Continue animation
        if (this.isActive) {
            this.animationFrame = requestAnimationFrame(() => this.updateCycleProgress());
        }
    }
    
    setupStaticArc() {
        if (!this.progressCycle) return;
        
        // Calculate the active portion of the cycle (duration/cycle_time)
        const activePortion = this.duration / this.cycleTime;
        const circumference = 534.07; // 2 * π * 85
        
        // Calculate how much of the circle should be colored (active portion only)
        const activeArcLength = circumference * activePortion;
        const inactiveArcLength = circumference - activeArcLength;
        
        // Set the dash array to show only the active portion in color (static at top)
        this.progressCycle.style.strokeDasharray = `${activeArcLength} ${inactiveArcLength}`;
        this.progressCycle.style.strokeDashoffset = '0'; // Keep at top, no rotation
    }
    
    updateBallPosition(cycleProgress) {
        if (!this.progressIndicator || !this.progressContainer) return;
        
        // Validate cycleProgress
        if (isNaN(cycleProgress) || !isFinite(cycleProgress)) {
            cycleProgress = 0; // Reset to start position if invalid
        }
        
        // Get actual container size (responsive)
        const containerRect = this.progressContainer.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) {
            // Container not visible, skip update
            return;
        }
        
        const containerSize = containerRect.width;
        const radius = 85 * (containerSize / 200); // Scale radius to container
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        
        // Calculate angle (starting from top, going clockwise)
        const angle = (cycleProgress * 2 * Math.PI) - (Math.PI / 2); // -π/2 to start from top
        
        // Calculate ball position
        const ballX = centerX + radius * Math.cos(angle);
        const ballY = centerY + radius * Math.sin(angle);
        
        // Validate calculated positions
        if (isNaN(ballX) || isNaN(ballY) || !isFinite(ballX) || !isFinite(ballY)) {
            console.warn('Invalid ball position calculated, skipping update');
            return;
        }
        
        this.progressIndicator.style.left = `${ballX}px`;
        this.progressIndicator.style.top = `${ballY}px`;
    }
    
    stopProgressCircle() {
        if (!this.progressContainer) return;
        
        // Hide progress circle
        this.progressContainer.className = 'progress-circle-container';
        
        // Cancel animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Reset progress cycle
        if (this.progressCycle) {
            this.progressCycle.style.strokeDasharray = '0 534.07';
            this.progressCycle.style.strokeDashoffset = '0';
        }
        
        // Clear timing data and flags
        this.scheduleStartTime = null;
        this.scheduleDuration = null;
        this.cycleStartTime = null;
        this.arcInitialized = false;
        this.lastCycleProgress = 0;
    }
    
    updateProgressFromStatus(status) {
        // Update progress circle based on current status
        if (status.active_formula && status.active_formula !== 'off') {
            // Only start progress circle if it's not already running for the same formula
            const isAlreadyRunning = this.isActive && 
                                   this.selectedFormula === status.active_formula &&
                                   this.progressContainer &&
                                   this.progressContainer.classList.contains('active');
            
            if (!isAlreadyRunning) {
                const isScheduled = status.active_schedule === status.active_formula;
                let scheduleDuration = null;
                
                // Calculate remaining schedule duration if scheduled
                if (isScheduled && status.schedule_end_time) {
                    const now = Date.now() / 1000; // Convert to seconds
                    scheduleDuration = Math.max(0, status.schedule_end_time - now);
                }
                
                this.startProgressCircle(status.active_formula, isScheduled, scheduleDuration);
            }
        } else {
            this.stopProgressCircle();
        }
    }
    
    updateProgressCircleTiming() {
        // Force update of the progress circle with new timing settings
        if (this.isActive && this.progressContainer) {
            // Reset the arc initialization to force recalculation
            this.arcInitialized = false;
            
            // If the progress circle is currently active, update it immediately
            if (this.progressContainer.classList.contains('active')) {
                // Trigger a setupStaticArc call on next animation frame
                if (this.progressCycle) {
                    this.setupStaticArc();
                }
            }
        }
    }
    

    
    async reactivateWithNewSettings() {
        // Reactivate the formula with new settings and reset cycle timing (ball jumps to start)
        try {
            this.updateStatus('Updating...', true);
            
            const response = await window.api.post('/api/activate', {
                color: this.selectedFormula,
                cycle_time: this.cycleTime,
                duration: this.duration
            });
            
            // Restart progress circle with fresh cycle timing (ball starts from top)
            this.startProgressCircle(this.selectedFormula, false, null, false); // preserveCycleTime = false
            
            this.updateStatus(`${getFormulaDisplayName(this.selectedFormula)} Active`, true);
            
        } catch (error) {
            console.error('Error reactivating formula:', error);
            // Fall back to regular selectFormula if API call fails
            this.selectFormula(this.selectedFormula);
        }
    }
}

// Enhanced button interactions
class ButtonEffects {
    constructor() {
        this.initializeEffects();
    }
    
    initializeEffects() {
        // Add ripple effect to all dots
        document.querySelectorAll('.dot').forEach(element => {
            element.addEventListener('click', this.createRipple.bind(this));
        });
        
        // Add hover sound effect (visual feedback)
        document.querySelectorAll('.dot').forEach(btn => {
            btn.addEventListener('mouseenter', this.addHoverEffect.bind(this));
            btn.addEventListener('mouseleave', this.removeHoverEffect.bind(this));
        });
    }
    
    createRipple(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Add ripple animation CSS if not exists
        if (!document.querySelector('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    addHoverEffect(e) {
        const btn = e.currentTarget;
        const icon = btn.querySelector('.formula-icon');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
            icon.style.transition = 'transform 0.3s ease';
        }
    }
    
    removeHoverEffect(e) {
        const btn = e.currentTarget;
        const icon = btn.querySelector('.formula-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }
}

// Keyboard shortcuts
class KeyboardShortcuts {
    constructor(selectionController) {
        this.controller = selectionController;
        this.bindShortcuts();
    }
    
    bindShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only activate shortcuts if no input is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'SELECT') {
                return;
            }
            
            switch(e.key.toLowerCase()) {
                case '1':
                case 'r':
                    e.preventDefault();
                    this.controller.selectFormula('red');
                    break;
                case '2':
                case 'b':
                    e.preventDefault();
                    this.controller.selectFormula('blue');
                    break;
                case '3':
                case 'y':
                    e.preventDefault();
                    this.controller.selectFormula('yellow');
                    break;
                case '4':
                case 'g':
                    e.preventDefault();
                    this.controller.selectFormula('green');
                    break;
                case '0':
                case 'o':
                case 'escape':
                    e.preventDefault();
                    this.controller.deactivateAll();
                    break;
            }
        });
    }
}

// Helper function to get display names for formulas
function getFormulaDisplayName(color) {
    const displayNames = {
        'red': 'Crimson',
        'blue': 'Azure', 
        'yellow': 'Amber',
        'green': 'Sage',
        'off': 'Off'
    };
    return displayNames[color] || color.charAt(0).toUpperCase() + color.slice(1);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const selectionController = new SelectionController();
    const buttonEffects = new ButtonEffects();
    const keyboardShortcuts = new KeyboardShortcuts(selectionController);
    
    // Start status polling
    selectionController.startStatusPolling();
    
    // Show keyboard shortcuts hint
    setTimeout(() => {
        window.notifications.show(
            'Tip: Use keyboard shortcuts - R/1 (Red), B/2 (Blue), Y/3 (Yellow), G/4 (Green), O/0 (Off)',
            'info',
            8000
        );
    }, 2000);
});