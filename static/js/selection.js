// Selection page functionality

class SelectionController {
    constructor() {
        this.selectedFormula = null;
        this.cycleTime = 60; // Fixed at 60 seconds
        this.diffusionDuration = 10; // Default to 10 seconds
        this.isActive = false;
        
        // Demo mode properties
        this.isInDemoMode = false;
        this.demoSequence = ['yellow', 'green', 'blue', 'red'];
        this.demoCurrentStep = 0;
        this.demoTimeout = null;
        
        // Scent descriptions for all modes
        this.scentDescriptions = {
            'yellow': 'Warm and inviting amber creates a cozy atmosphere with rich, honeyed notes.',
            'green': 'Fresh sage brings clarity and purification with herbal, earthy essence.',
            'blue': 'Cool azure refreshes the mind with crisp, oceanic tranquility.',
            'red': 'Bold crimson energizes the space with deep, passionate intensity.'
        };
        
        // Configuration: Set to true to use page reload instead of position reset
        this.usePageReload = false; // Change to true if position reset doesn't work
        
        this.initializeElements();
        this.bindEvents();
        this.updateSliderDisplay(); // Set initial slider display
        this.loadStatus();
    }
    
    initializeElements() {
        this.formulaBtns = document.querySelectorAll('.dot');
        this.offBtn = document.getElementById('off-btn');
        
        // Slider elements
        this.diffusionSlider = document.getElementById('diffusion-slider');
        this.diffusionSecondsDisplay = document.getElementById('diffusion-seconds');
        
        // Demo elements
        this.demoBtn = document.getElementById('demo-btn');
        
        // Scent description elements (used for all scent activations)
        this.scentDescription = document.getElementById('scent-description');
        this.scentName = document.getElementById('scent-name');
        this.scentDescriptionText = document.getElementById('scent-description-text');
        
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
        
        // Diffusion slider changes
        if (this.diffusionSlider) {
            this.diffusionSlider.addEventListener('input', (e) => {
                this.setDiffusionDuration(parseInt(e.target.value));
            });
        }
        
        // Demo button click
        if (this.demoBtn) {
            this.demoBtn.addEventListener('click', () => {
                if (!this.isInDemoMode) {
                    this.startDemoMode();
                } else {
                    this.stopDemoMode();
                }
            });
        }
        
        // Demo link click (from instruction text)
        const demoLink = document.querySelector('.demo-link');
        if (demoLink) {
            demoLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.highlightDemoButton();
            });
        }
    }
    
    async selectFormula(color) {
        try {
            this.updateStatus('Activating...', false);
            
            const response = await window.api.post('/api/activate', {
                color: color,
                cycle_time: this.cycleTime,
                duration: this.diffusionDuration
            });
            
            this.selectedFormula = color;
            this.isActive = true;
            
            this.updateFormulaButtons();
            this.updateStatus(`${getFormulaDisplayName(color)} Active`, true);
            
            // Start progress circle for manual activation
            this.startProgressCircle(color, false);
            
            // Show scent description
            this.showScentDescription(color);
            
            window.notifications.success(
                `${getFormulaDisplayName(color)} formula activated (${this.diffusionDuration}s of ${this.cycleTime}s)`
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
            
            // Hide scent description
            this.hideScentDescription();
            
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
    
    setDiffusionDuration(duration) {
        this.diffusionDuration = duration;
        this.updateSliderDisplay();
        
        // If currently active, restart the cycle with new settings (ball jumps to start)
        if (this.isActive && this.selectedFormula) {
            // Update the progress circle immediately with new timing
            this.updateProgressCircleTiming();
            // Reactivate with new settings - this will reset the cycle timing
            this.reactivateWithNewSettings();
        }
    }
    
    updateSliderDisplay() {
        if (this.diffusionSecondsDisplay) {
            this.diffusionSecondsDisplay.textContent = this.diffusionDuration;
        }
        if (this.diffusionSlider) {
            this.diffusionSlider.value = this.diffusionDuration;
            
            // Update the progress fill (black area to the left of the thumb)
            const percentage = ((this.diffusionDuration - 5) / (60 - 5)) * 100;
            this.diffusionSlider.style.setProperty('--sx', `${percentage}%`);
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
        
        // Handle OFF button selection when no formula is active
        if (this.offBtn) {
            if (!this.isActive || this.selectedFormula === null) {
                this.offBtn.classList.add('selected');
            } else {
                this.offBtn.classList.remove('selected');
            }
        }
    }
    
    // No longer needed as we use a slider instead of buttons
    updateConfigButtons() {
        // This method is kept for compatibility but no longer does anything
        // since we replaced the config buttons with a slider
    }
    
    updateStatus(text, active) {
        // Status indicator has been replaced with scent descriptions
        // This method is kept for compatibility but no longer updates UI elements
    }
    
    async loadStatus() {
        try {
            const status = await window.api.get('/api/status');
            
            if (status.active_formula && status.active_formula !== 'off') {
                // Always synchronize with backend - this is the single source of truth
                this.synchronizeWithBackend(status);
            } else {
                this.selectedFormula = null;
                this.isActive = false;
                this.updateFormulaButtons();
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
    
    startProgressCircleSync(formula, status) {
        // Start progress circle synchronized with backend timing
        if (!this.progressContainer) return;
        
        // Only cancel existing animation if we're switching formulas or not already running
        const isNewFormula = !this.progressContainer.classList.contains(`formula-${formula}`);
        const isNotRunning = !this.animationFrame;
        
        if (isNewFormula || isNotRunning) {
            // Cancel existing animation only if needed
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Set formula color
            this.progressContainer.className = `progress-circle-container active formula-${formula}`;
            
            // Reset arc initialization to ensure it gets recalculated for new formula
            this.arcInitialized = false;
        }
        
        // Store schedule information (always update this)
        this.scheduleStartTime = Date.now();
        if (status.schedule_end_time) {
            this.scheduleDuration = Math.max(0, status.schedule_end_time - (Date.now() / 1000));
        }
        
        // Start or continue cycle animation with synchronized timing
        if (!this.animationFrame) {
            this.startCycleAnimation();
        }
    }
    
    startCycleAnimation() {
        if (!this.progressIndicator) return;
        
        // If cycleStartTime is not set, set it now (for manual activations)
        if (!this.cycleStartTime) {
            this.cycleStartTime = Date.now();
        }
        
        // Position the ball on the circle based on current cycle progress
        this.positionIndicatorBall();
        
        // Update cycle progress indicator
        this.updateCycleProgress();
    }
    
    positionIndicatorBall() {
        if (!this.progressIndicator || !this.progressContainer || !this.cycleStartTime) return;
        
        // Calculate current cycle progress to position ball correctly
        const now = Date.now();
        const cycleElapsed = (now - this.cycleStartTime) % (this.cycleTime * 1000);
        let cycleProgress = cycleElapsed / (this.cycleTime * 1000);
        
        // Validate and bound the progress
        if (isNaN(cycleProgress) || !isFinite(cycleProgress)) {
            cycleProgress = 0;
        }
        cycleProgress = Math.max(0, Math.min(1, cycleProgress));
        
        // Update ball position based on current progress
        this.updateBallPosition(cycleProgress);
    }
    
    updateCycleProgress() {
        if (!this.progressCycle || !this.isActive || !this.cycleStartTime || this.cycleTime <= 0) return;
        
        const now = Date.now();
        const cycleElapsed = (now - this.cycleStartTime) % (this.cycleTime * 1000);
        let cycleProgress = cycleElapsed / (this.cycleTime * 1000);
        
        // Validate cycleProgress to prevent NaN or invalid values
        if (isNaN(cycleProgress) || !isFinite(cycleProgress)) {
            console.warn('Invalid cycle progress calculated, will be corrected on next status update');
            cycleProgress = 0; // Use 0 instead of resetting time (backend is source of truth)
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
        
        // Calculate the active portion of the cycle (diffusion duration / cycle time)
        const activePortion = this.diffusionDuration / this.cycleTime;
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
            // Synchronize with backend cycle timing
            this.synchronizeWithBackend(status);
        } else {
            this.stopProgressCircle();
        }
    }
    
    synchronizeWithBackend(status) {
        // Use backend as single source of truth for cycle timing
        if (status.cycle_start_time && status.current_cycle_time && status.current_duration) {
            // Update local settings to match backend
            this.cycleTime = status.current_cycle_time;
            // Update diffusion duration from backend
            this.diffusionDuration = status.current_duration;
            this.updateSliderDisplay();
            
            // Calculate backend cycle start time in frontend time
            const backendCycleStartMs = status.cycle_start_time * 1000; // Convert to milliseconds
            
            // Calculate current cycle progress for debugging
            const now = Date.now();
            const cycleElapsed = (now - backendCycleStartMs) % (this.cycleTime * 1000);
            const cycleProgress = cycleElapsed / (this.cycleTime * 1000);
            
            console.log('🔄 Synchronizing with backend:', {
                formula: status.active_formula,
                backendCycleStart: new Date(backendCycleStartMs).toLocaleTimeString(),
                currentProgress: Math.round(cycleProgress * 100) + '%',
                cycleTime: this.cycleTime,
                diffusionDuration: this.diffusionDuration
            });
            
            // Always synchronize with backend timing (single source of truth)
            // Set formula state
            this.selectedFormula = status.active_formula;
            this.isActive = true;
            
            // Always use backend cycle timing - this is the single source of truth
            this.cycleStartTime = backendCycleStartMs;
            
            // Start or update progress circle with synchronized timing
            this.startProgressCircleSync(status.active_formula, status);
            
            // Update UI elements
            this.updateFormulaButtons();
            this.updateConfigButtons();
            this.updateStatus(`${getFormulaDisplayName(status.active_formula)} Active`, true);
        } else {
            console.log('⚠️ Backend cycle timing not available, using fallback method');
            // Fallback to old method if backend doesn't provide cycle timing
            const isAlreadyRunning = this.isActive && 
                                   this.selectedFormula === status.active_formula &&
                                   this.progressContainer &&
                                   this.progressContainer.classList.contains('active');
            
            if (!isAlreadyRunning) {
                const isScheduled = status.active_schedule === status.active_formula;
                let scheduleDuration = null;
                
                if (isScheduled && status.schedule_end_time) {
                    const now = Date.now() / 1000;
                    scheduleDuration = Math.max(0, status.schedule_end_time - now);
                }
                
                this.startProgressCircle(status.active_formula, isScheduled, scheduleDuration);
            }
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
                duration: this.diffusionDuration
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
    
    // Scent Description Methods
    showScentDescription(color) {
        if (!this.scentDescription || !this.scentName || !this.scentDescriptionText) return;
        
        const colorNames = {
            'yellow': 'Amber',
            'green': 'Sage', 
            'blue': 'Azure',
            'red': 'Crimson'
        };
        const colorClassNames = {
            'yellow': 'amber',
            'green': 'sage',
            'blue': 'azure',
            'red': 'crimson'
        };
        
        // Update content
        this.scentName.textContent = colorNames[color];
        this.scentDescriptionText.textContent = this.scentDescriptions[color];
        
        // Remove previous color classes and add current one
        this.scentDescription.className = this.scentDescription.className.replace(/\b(amber|sage|azure|crimson)\b/g, '');
        this.scentDescription.classList.add(colorClassNames[color]);
        
        // Show the container
        this.scentDescription.classList.remove('hidden');
    }
    
    hideScentDescription() {
        if (!this.scentDescription) return;
        
        // Hide the container and remove color classes
        this.scentDescription.classList.add('hidden');
        this.scentDescription.className = this.scentDescription.className.replace(/\b(amber|sage|azure|crimson)\b/g, '');
    }
    
    // Demo Mode Methods
    startDemoMode() {
        if (this.isInDemoMode) return;
        
        this.isInDemoMode = true;
        this.demoCurrentStep = 0;
        
        // Set diffusion duration to 5 seconds for demo
        this.setDiffusionDuration(5);
        if (this.diffusionSlider) {
            this.diffusionSlider.value = 5;
        }
        
        // Update demo button
        this.demoBtn.textContent = 'Stop Demo';
        this.demoBtn.classList.add('active');
        this.demoBtn.disabled = false;
        
        // Start the demo sequence (scent description will be shown by selectFormula)
        this.executeDemoStep();
    }
    
    stopDemoMode() {
        this.isInDemoMode = false;
        
        // Clear any pending timeouts
        if (this.demoTimeout) {
            clearTimeout(this.demoTimeout);
            this.demoTimeout = null;
        }
        
        // Update demo button
        this.demoBtn.textContent = 'Start Demo';
        this.demoBtn.classList.remove('active');
        
        // Activate off button (this will hide the scent description)
        this.deactivateAll();
    }
    
    highlightDemoButton() {
        // Scroll to demo button
        this.demoBtn.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Add temporary highlight effect
        this.demoBtn.style.animation = 'pulse 2s ease-in-out 3';
        
        // Remove animation after it completes
        setTimeout(() => {
            this.demoBtn.style.animation = '';
        }, 6000);
    }
    
    async executeDemoStep() {
        if (!this.isInDemoMode) return;
        
        const currentColor = this.demoSequence[this.demoCurrentStep];
        
        // Activate the scent (this will automatically show the scent description)
        try {
            await this.selectFormula(currentColor);
        } catch (error) {
            console.error('Demo step error:', error);
        }
        
        // Schedule next step or finish demo
        this.demoTimeout = setTimeout(() => {
            this.demoCurrentStep++;
            
            if (this.demoCurrentStep >= this.demoSequence.length) {
                // Demo finished
                this.stopDemoMode();
            } else {
                // Continue to next step
                this.executeDemoStep();
            }
        }, 5000); // 5 seconds per scent
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
        
        // Don't override position - buttons need to stay absolutely positioned for radial layout
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