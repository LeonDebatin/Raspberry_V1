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
        
        // Schedule information elements
        this.scheduleInfo = document.getElementById('schedule-info');
        this.scheduleDetails = document.getElementById('schedule-details');
        this.scheduleEditLink = document.getElementById('schedule-edit-link');
        this.scheduleStatus = document.getElementById('schedule-status');
        this.scheduleActivateBtn = document.getElementById('schedule-activate-btn');
        console.log('Found scheduleEditLink:', this.scheduleEditLink);
        
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
        
        // Schedule edit link click handler
        if (this.scheduleEditLink) {
            this.scheduleEditLink.addEventListener('click', (e) => {
                const href = this.scheduleEditLink.href;
                console.log('Schedule edit link clicked, href:', href);
                
                // Only prevent default if it's still the placeholder href
                if (href === '#' || href.endsWith('#')) {
                    e.preventDefault();
                    console.warn('Edit link clicked but no valid href set');
                } else {
                    console.log('Navigating to:', href);
                    // Let the default navigation happen
                }
            });
        }
        
        // Schedule status button click handler
        if (this.scheduleStatus) {
            this.scheduleStatus.addEventListener('click', () => {
                this.toggleScheduleStatus();
            });
        }
        
        // Schedule activate button click handler
        if (this.scheduleActivateBtn) {
            this.scheduleActivateBtn.addEventListener('click', () => {
                this.activateSchedule();
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
            
            // Hide schedule info immediately when user manually overrides
            this.hideScheduleInfoAndWarn();
            
            // Check if a schedule was paused
            if (response.paused_schedule) {
                const pausedFormula = getFormulaDisplayName(response.paused_schedule.formula);
                const timeRange = `${response.paused_schedule.start_time}-${response.paused_schedule.end_time}`;
                window.notifications.info(
                    `⏸️ Paused scheduled ${pausedFormula} (${timeRange}) - Manual override active`
                );
            }
            
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
            
            const response = await window.api.post('/api/deactivate', {});
            
            this.selectedFormula = null;
            this.isActive = false;
            
            this.updateFormulaButtons();
            this.updateStatus('Ready', false);
            
            // Stop progress circle
            this.stopProgressCircle();
            
            // Hide scent description
            this.hideScentDescription();
            
            // Hide schedule info immediately when user manually stops
            this.hideScheduleInfoAndWarn();
            
            // Check if a schedule was paused
            if (response.paused_schedule) {
                const pausedFormula = getFormulaDisplayName(response.paused_schedule.formula);
                const timeRange = `${response.paused_schedule.start_time}-${response.paused_schedule.end_time}`;
                window.notifications.info(
                    `⏸️ Paused scheduled ${pausedFormula} (${timeRange}) - Manual stop requested`
                );
            }
            
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
        
        // Hide schedule info and show warning if schedule was active
        this.hideScheduleInfoAndWarn();
        
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
    
    hideScheduleInfoAndWarn() {
        const scheduleInfo = document.getElementById('schedule-info');
        
        if (scheduleInfo && scheduleInfo.style.display !== 'none') {
            // Store the current schedule as inactive in localStorage for persistence
            if (this.currentSchedule) {
                localStorage.setItem('inactiveSchedule', JSON.stringify({
                    ...this.currentSchedule,
                    inactive: true,
                    inactiveAt: Date.now()
                }));
            }
            
            // Make schedule info grey (inactive) but keep it visible
            this.makeScheduleInfoInactive();
            
            // No warning message - just keep the grey schedule info visible
        }
    }
    
    makeScheduleInfoInactive() {
        if (!this.scheduleInfo) return;
        
        // Remove all color classes and add inactive class
        this.clearScheduleColor();
        this.scheduleInfo.classList.add('inactive');
        
        // Update status to show inactive
        if (this.scheduleStatus) {
            this.scheduleStatus.textContent = 'INACTIVE';
            this.scheduleStatus.className = 'schedule-status-btn inactive';
            this.scheduleStatus.title = 'Schedule was deactivated by manual override';
        }
        
        // Keep text color white (don't change to grey)
        if (this.scheduleDetails) {
            this.scheduleDetails.style.color = ''; // Reset to default (white)
        }
        
        // Replace edit link with an activate button
        if (this.scheduleEditLink) {
            // Store the original link for restoration later
            if (!this.originalEditLink) {
                this.originalEditLink = {
                    outerHTML: this.scheduleEditLink.outerHTML,
                    parent: this.scheduleEditLink.parentNode
                };
            }
            
            // Create activate button
            const activateBtn = document.createElement('button');
            activateBtn.textContent = 'Activate Schedule';
            activateBtn.className = 'schedule-link activate-btn';
            
            // Get the schedule color from current schedule or default to blue
            const scheduleColor = this.currentSchedule?.formula || 'blue';
            const scentColorMap = {
                'blue': '#007bff',    // Azure - Blue
                'yellow': '#ffc107',  // Amber - Yellow
                'green': '#28a745',   // Sage - Green  
                'red': '#dc3545'      // Crimson - Red
            };
            const buttonColor = scentColorMap[scheduleColor] || '#007bff';
            
            activateBtn.style.cssText = `
                background: ${buttonColor};
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
                font-weight: 600;
                opacity: 0.75;
            `;
            activateBtn.onclick = () => {
                console.log('Activate Schedule button clicked');
                this.activateCurrentSchedule();
            };
            console.log('Created activate button');
            
            // Replace the link with the button
            this.scheduleEditLink.parentNode.replaceChild(activateBtn, this.scheduleEditLink);
            this.scheduleEditLink = activateBtn; // Update reference
        }
    }
    
    restoreOriginalEditLink() {
        // Only restore if we have a stored original and current element is a button
        if (this.originalEditLink && this.scheduleEditLink && this.scheduleEditLink.tagName === 'BUTTON') {
            // Create new link element from stored HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.originalEditLink.outerHTML;
            const newLink = tempDiv.firstChild;
            
            // Replace button with original link
            this.scheduleEditLink.parentNode.replaceChild(newLink, this.scheduleEditLink);
            this.scheduleEditLink = newLink; // Update reference
            
            // Clear the stored original
            this.originalEditLink = null;
        }
    }
    
    async activateCurrentSchedule() {
        try {
            console.log('🔄 Activating current schedule...');
            
            // If we have stored currentSchedule from when schedule info was displayed, use it
            if (this.currentSchedule && this.currentSchedule.id) {
                console.log('📋 Using stored schedule data:', this.currentSchedule);
                
                const scentName = this.getFormulaDisplayName(this.currentSchedule.formula);
                
                // Prepare the update data to unpause the schedule
                const updateData = {
                    start_time: this.currentSchedule.start_time,
                    end_time: this.currentSchedule.end_time,
                    formula: this.currentSchedule.formula,
                    cycle_time: this.currentSchedule.cycle_time || 60,
                    duration: this.currentSchedule.duration || 10,
                    recurrence: this.currentSchedule.recurrence || "daily",
                    enabled: true,
                    paused: false  // Explicitly unpause
                };
                console.log('📤 Update data:', updateData);
                
                // Reactivate the paused schedule
                const response = await window.api.put(`/api/schedules/${this.currentSchedule.id}`, updateData);
                console.log('📥 API response:', response);
                
                if (response && (response.start_time || response.id)) {
                    const timeRange = `${this.currentSchedule.start_time}-${this.currentSchedule.end_time}`;
                    window.notifications.success(`✅ Reactivated scheduled ${scentName} (${timeRange})`);
                    console.log('✅ Schedule reactivated successfully');
                    
                    // Clear the stored inactive schedule since it's now active
                    localStorage.removeItem('inactiveSchedule');
                    
                    // Reload the page to show updated schedule state
                    setTimeout(() => {
                        window.location.reload();
                    }, 200); // Faster reload
                } else {
                    console.log('❌ API response unexpected format');
                    window.notifications.error('Failed to reactivate schedule');
                }
                return;
            }
            
            // Fallback: Try to find paused schedule via API
            const scheduleResponse = await window.api.get('/api/schedule-status');
            console.log('📊 Schedule response:', scheduleResponse);
            
            if (!scheduleResponse.paused_schedule) {
                console.log('❌ No paused schedule found and no stored schedule data');
                window.notifications.error('No paused schedule found to activate');
                return;
            }
            
            // Use the API response (same as before)
            const pausedSchedule = scheduleResponse.paused_schedule;
            const scentName = this.getFormulaDisplayName(pausedSchedule.formula);
            
            const response = await window.api.put(`/api/schedules/${pausedSchedule.id}`, {
                start_time: pausedSchedule.start_time,
                end_time: pausedSchedule.end_time,
                formula: pausedSchedule.formula,
                cycle_time: pausedSchedule.cycle_time || 60,
                duration: pausedSchedule.duration || 10,
                recurrence: pausedSchedule.recurrence || "daily",
                enabled: true,
                paused: false
            });
            
            if (response && (response.start_time || response.id)) {
                const timeRange = `${pausedSchedule.start_time}-${pausedSchedule.end_time}`;
                window.notifications.success(`✅ Reactivated scheduled ${scentName} (${timeRange})`);
                setTimeout(() => {
                    window.location.reload();
                }, 500); // Faster reload
            } else {
                window.notifications.error('Failed to reactivate schedule');
            }
        } catch (error) {
            console.error('💥 Error reactivating schedule:', error);
            window.notifications.error('Error reactivating schedule');
        }
    }
    
    showWarningMessage(message) {
        // Create or get existing warning element
        let warningElement = document.getElementById('schedule-warning');
        
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'schedule-warning';
            warningElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: -350px;
                background: #d3d3d3;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                font-size: 14px;
                max-width: 300px;
                text-align: center;
                transition: right 0.3s ease;
            `;
            document.body.appendChild(warningElement);
        }
        
        // Set message and show
        warningElement.innerHTML = message;
        
        // Animate in
        setTimeout(() => {
            warningElement.style.right = '20px';
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            warningElement.style.right = '-350px';
        }, 3000);
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
                
                // Hide scent description
                this.hideScentDescription();
                
                // Still check for schedule info even when no formula is active (might be paused schedule)
                this.showScheduleInfo();
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
            
            // Show scent description (same as manual activation)
            this.showScentDescription(status.active_formula);
            
            // Check and show schedule information (regardless of active formula)
            this.showScheduleInfo();
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
    
    // Schedule Information Methods
    async showScheduleInfo(activeFormula = null) {
        if (!this.scheduleInfo || !this.scheduleDetails || !this.scheduleEditLink) return;
        
        try {
            // Get current schedule information
            const scheduleResponse = await window.api.get('/api/schedule-status');
            
            // Check for any active schedule (regardless of current selection)
            if (scheduleResponse.active_schedule) {
                const activeSchedule = scheduleResponse.active_schedule;
                // Store the current active schedule
                this.currentSchedule = activeSchedule;
                const scheduledFormula = activeSchedule.formula;
                const scent = this.getFormulaDisplayName(scheduledFormula);
                const recurrence = this.getRecurrenceDisplayName(activeSchedule.recurrence || 'daily');
                const startTime = activeSchedule.start_time || 'Unknown';
                const endTime = activeSchedule.end_time || 'Unknown';
                
                // Update schedule details text
                this.scheduleDetails.textContent = `${scent} - ${recurrence} | ${startTime} - ${endTime}`;
                this.scheduleDetails.style.color = ''; // Reset color
                
                // Update status button (if it exists)
                if (this.scheduleStatus) {
                    this.scheduleStatus.textContent = 'ACTIVE';
                    this.scheduleStatus.className = 'schedule-status-btn';
                    this.scheduleStatus.title = 'Click to pause schedule';
                }
                
                // Restore original edit link if it was replaced with a button
                this.restoreOriginalEditLink();
                
                // Update edit link to go to schedule page with the active schedule ID
                const scheduleId = activeSchedule.id;
                this.scheduleEditLink.textContent = 'Edit Schedule';
                this.scheduleEditLink.href = `/schedule/${scheduleId}`;
                this.scheduleEditLink.onclick = null; // Remove any custom click handler
                
                // Apply color class based on formula and show the container
                this.applyScheduleColor(scheduledFormula);
                this.scheduleInfo.classList.remove('hidden');
                
                return true; // Schedule info was shown
            }
            // Check for any paused schedule (regardless of current selection)
            else if (scheduleResponse.paused_schedule) {
                const pausedSchedule = scheduleResponse.paused_schedule;
                // Store the current paused schedule for the activate button
                this.currentSchedule = pausedSchedule;
                const scheduledFormula = pausedSchedule.formula;
                const scent = this.getFormulaDisplayName(scheduledFormula);
                const recurrence = this.getRecurrenceDisplayName(pausedSchedule.recurrence || 'daily');
                const startTime = pausedSchedule.start_time || 'Unknown';
                const endTime = pausedSchedule.end_time || 'Unknown';
                
                // Update schedule details text (remove PAUSED from text since it's in status)
                this.scheduleDetails.textContent = `${scent} - ${recurrence} | ${startTime} - ${endTime}`;
                this.scheduleDetails.style.color = '#ff9800'; // Orange color for paused
                
                // Update status button (if it exists)
                if (this.scheduleStatus) {
                    this.scheduleStatus.textContent = 'PAUSED';
                    this.scheduleStatus.className = 'schedule-status-btn paused';
                    this.scheduleStatus.title = 'Click to resume schedule';
                }
                
                // Restore original edit link if it was replaced with a button
                this.restoreOriginalEditLink();
                
                // Update edit link (we might not have the ID for paused, so link to main schedule page)
                this.scheduleEditLink.textContent = 'Edit Schedule';
                this.scheduleEditLink.href = `/schedule`;
                this.scheduleEditLink.onclick = null; // Remove any custom click handler
                
                // Show activate button for paused schedules
                if (this.scheduleActivateBtn) {
                    this.scheduleActivateBtn.classList.remove('hidden');
                    // Apply the schedule color to the activate button
                    this.applyActivateButtonColor(scheduledFormula);
                }
                
                // Apply color class based on formula and show the container
                this.applyScheduleColor(scheduledFormula);
                this.scheduleInfo.classList.remove('hidden');
                
                return true; // Paused schedule info was shown
            } 
            // Check if we have a stored currentSchedule that should remain visible as inactive
            else if (this.currentSchedule && this.currentSchedule.id) {
                console.log('📋 Showing stored schedule as inactive');
                
                const scheduledFormula = this.currentSchedule.formula;
                const scent = this.getFormulaDisplayName(scheduledFormula);
                const recurrence = this.getRecurrenceDisplayName(this.currentSchedule.recurrence || 'daily');
                const startTime = this.currentSchedule.start_time || 'Unknown';
                const endTime = this.currentSchedule.end_time || 'Unknown';
                
                // Update schedule details text
                this.scheduleDetails.textContent = `${scent} - ${recurrence} | ${startTime} - ${endTime}`;
                this.scheduleDetails.style.color = ''; // Reset color
                
                // Show as inactive
                this.makeScheduleInfoInactive();
                
                // Apply color class and show the container
                this.applyScheduleColor(scheduledFormula);
                this.scheduleInfo.classList.remove('hidden');
                
                return true; // Inactive schedule info was shown
            }
            // Check for stored inactive schedule from localStorage
            else {
                const storedInactiveSchedule = localStorage.getItem('inactiveSchedule');
                if (storedInactiveSchedule) {
                    try {
                        const inactiveSchedule = JSON.parse(storedInactiveSchedule);
                        // Only show if it's recent (within last 24 hours)
                        const hoursSinceInactive = (Date.now() - inactiveSchedule.inactiveAt) / (1000 * 60 * 60);
                        
                        if (hoursSinceInactive < 24) {
                            console.log('📋 Showing stored inactive schedule from localStorage');
                            
                            this.currentSchedule = inactiveSchedule;
                            const scheduledFormula = inactiveSchedule.formula;
                            const scent = this.getFormulaDisplayName(scheduledFormula);
                            const recurrence = this.getRecurrenceDisplayName(inactiveSchedule.recurrence || 'daily');
                            const startTime = inactiveSchedule.start_time || 'Unknown';
                            const endTime = inactiveSchedule.end_time || 'Unknown';
                            
                            // Update schedule details text
                            this.scheduleDetails.textContent = `${scent} - ${recurrence} | ${startTime} - ${endTime}`;
                            this.scheduleDetails.style.color = ''; // Reset color
                            
                            // Show as inactive
                            this.makeScheduleInfoInactive();
                            
                            // Apply color class and show the container
                            this.applyScheduleColor(scheduledFormula);
                            this.scheduleInfo.classList.remove('hidden');
                            
                            return true; // Stored inactive schedule info was shown
                        } else {
                            // Remove old inactive schedule
                            localStorage.removeItem('inactiveSchedule');
                        }
                    } catch (e) {
                        console.error('Error parsing stored inactive schedule:', e);
                        localStorage.removeItem('inactiveSchedule');
                    }
                }
                
                this.hideScheduleInfo();
                return false; // No schedule to show
            }
        } catch (error) {
            console.error('Error loading schedule info:', error);
            this.hideScheduleInfo();
            return false;
        }
    }
    
    hideScheduleInfo() {
        if (!this.scheduleInfo) return;
        
        // Clear color classes and hide the container
        this.clearScheduleColor();
        this.scheduleInfo.classList.add('hidden');
        console.log('Schedule info hidden due to manual override');
    }
    
    applyScheduleColor(formula) {
        if (!this.scheduleInfo) return;
        
        // Clear existing color classes
        this.clearScheduleColor();
        
        // Apply the appropriate color class based on formula using scent names
        if (formula && ['red', 'blue', 'yellow', 'green'].includes(formula)) {
            const colorMapping = {
                'yellow': 'amber',
                'green': 'sage',
                'blue': 'azure',
                'red': 'crimson'
            };
            this.scheduleInfo.classList.add(colorMapping[formula]);
        }
    }
    
    clearScheduleColor() {
        if (!this.scheduleInfo) return;
        
        // Remove all scent color classes
        this.scheduleInfo.classList.remove('amber', 'sage', 'azure', 'crimson');
    }
    
    applyActivateButtonColor(formula) {
        if (!this.scheduleActivateBtn) return;
        
        // Clear existing color classes from the activate button
        this.scheduleActivateBtn.classList.remove('crimson', 'azure', 'amber', 'sage');
        
        // Apply the appropriate color class based on formula using scent names
        if (formula && ['red', 'blue', 'yellow', 'green'].includes(formula)) {
            const colorMapping = {
                'yellow': 'amber',
                'green': 'sage',
                'blue': 'azure',
                'red': 'crimson'
            };
            this.scheduleActivateBtn.classList.add(colorMapping[formula]);
        }
    }
    
    async toggleScheduleStatus() {
        if (!this.scheduleStatus) return;
        
        try {
            const isCurrentlyPaused = this.scheduleStatus.textContent === 'PAUSED';
            
            if (isCurrentlyPaused) {
                // Resume the paused schedule
                const response = await window.api.post('/api/resume-schedule', {});
                
                if (response.resumed_schedule) {
                    const resumedFormula = this.getFormulaDisplayName(response.resumed_schedule.formula);
                    const timeRange = `${response.resumed_schedule.start_time}-${response.resumed_schedule.end_time}`;
                    window.notifications.success(
                        `▶️ Resumed scheduled ${resumedFormula} (${timeRange})`
                    );
                    
                    // Immediately update the button to ACTIVE
                    this.updateScheduleButtonToActive(response.resumed_schedule);
                    
                    // If schedule page is open, reload it to show updated status
                    this.reloadSchedulePageIfOpen();
                    
                    // Reload the page after a short delay to show the resumed schedule
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } else {
                // Pause the active schedule
                const response = await window.api.post('/api/pause-schedule', {});
                
                if (response.paused_schedule) {
                    const pausedFormula = this.getFormulaDisplayName(response.paused_schedule.formula);
                    const timeRange = `${response.paused_schedule.start_time}-${response.paused_schedule.end_time}`;
                    window.notifications.info(
                        `⏸️ Paused scheduled ${pausedFormula} (${timeRange})`
                    );
                    
                    // Immediately update the button to PAUSED
                    this.updateScheduleButtonToPaused(response.paused_schedule);
                    
                    // If schedule page is open, reload it to show updated status
                    this.reloadSchedulePageIfOpen();
                    
                    // Reload the page after a short delay to show the paused schedule
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }
            
        } catch (error) {
            console.error('Error toggling schedule status:', error);
            window.notifications.error('Error changing schedule status');
        }
    }
    
    async activateSchedule() {
        if (!this.scheduleStatus) return;
        
        try {
            // Resume the paused schedule using the same logic as toggleScheduleStatus
            const response = await window.api.post('/api/resume-schedule', {});
            
            if (response.resumed_schedule) {
                const resumedFormula = this.getFormulaDisplayName(response.resumed_schedule.formula);
                const timeRange = `${response.resumed_schedule.start_time}-${response.resumed_schedule.end_time}`;
                window.notifications.success(
                    `✅ Activated scheduled ${resumedFormula} (${timeRange})`
                );
                
                // Immediately update the button to ACTIVE
                this.updateScheduleButtonToActive(response.resumed_schedule);
                
                // If schedule page is open, reload it to show updated status
                this.reloadSchedulePageIfOpen();
                
                // Reload the page after a short delay to show the resumed schedule
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error activating schedule:', error);
            window.notifications.error('Error activating schedule');
        }
    }
    
    getFormulaDisplayName(color) {
        const displayNames = {
            'red': 'Crimson',
            'blue': 'Azure', 
            'yellow': 'Amber',
            'green': 'Sage'
        };
        return displayNames[color] || color.charAt(0).toUpperCase() + color.slice(1);
    }
    
    updateScheduleButtonToPaused(pausedSchedule) {
        // Immediately update the schedule status button to show PAUSED state
        if (this.scheduleStatus && this.scheduleDetails && this.scheduleInfo) {
            const scent = this.getFormulaDisplayName(pausedSchedule.formula);
            const recurrence = this.getRecurrenceDisplayName(pausedSchedule.recurrence || 'daily');
            const startTime = pausedSchedule.start_time || 'Unknown';
            const endTime = pausedSchedule.end_time || 'Unknown';
            
            // Update schedule details
            this.scheduleDetails.textContent = `${scent} - ${recurrence} | ${startTime} - ${endTime}`;
            this.scheduleDetails.style.color = '#ff9800'; // Orange color for paused
            
            // Update status button immediately
            this.scheduleStatus.textContent = 'PAUSED';
            this.scheduleStatus.className = 'schedule-status-btn paused';
            this.scheduleStatus.title = 'Click to resume schedule';
            
            // Show activate button when paused
            if (this.scheduleActivateBtn) {
                this.scheduleActivateBtn.classList.remove('hidden');
                // Apply the schedule color to the activate button
                this.applyActivateButtonColor(pausedSchedule.formula);
            }
            
            // Apply color and show the schedule info container
            this.applyScheduleColor(pausedSchedule.formula);
            this.scheduleInfo.classList.remove('hidden');
            
            console.log('Immediately updated schedule button to PAUSED state');
        }
    }

    updateScheduleButtonToActive(activeSchedule) {
        // Immediately update the schedule status button to show ACTIVE state
        if (this.scheduleStatus && this.scheduleDetails && this.scheduleInfo) {
            const scent = this.getFormulaDisplayName(activeSchedule.formula);
            const recurrence = this.getRecurrenceDisplayName(activeSchedule.recurrence || 'daily');
            const startTime = activeSchedule.start_time || 'Unknown';
            const endTime = activeSchedule.end_time || 'Unknown';
            
            // Update schedule details
            this.scheduleDetails.textContent = `${scent} - ${recurrence} | ${startTime} - ${endTime}`;
            this.scheduleDetails.style.color = ''; // Reset color (back to default)
            
            // Update status button immediately
            this.scheduleStatus.textContent = 'ACTIVE';
            this.scheduleStatus.className = 'schedule-status-btn';
            this.scheduleStatus.title = 'Click to pause schedule';
            
            // Hide activate button when active
            if (this.scheduleActivateBtn) {
                this.scheduleActivateBtn.classList.add('hidden');
            }
            
            // Apply color and show the schedule info container
            this.applyScheduleColor(activeSchedule.formula);
            this.scheduleInfo.classList.remove('hidden');
            
            console.log('Immediately updated schedule button to ACTIVE state');
        }
    }

    reloadSchedulePageIfOpen() {
        // Check if we have multiple windows/tabs and communicate with schedule page
        try {
            // Use localStorage to signal schedule page to reload
            localStorage.setItem('scheduleReloadRequested', Date.now().toString());
            
            // Also send a message to other windows/tabs
            if (window.BroadcastChannel) {
                const channel = new BroadcastChannel('schedule-updates');
                channel.postMessage({ type: 'reload-schedules', timestamp: Date.now() });
                channel.close();
            }
        } catch (error) {
            console.log('Could not signal schedule page reload:', error);
        }
    }

    getRecurrenceDisplayName(recurrence) {
        const displayNames = {
            'once': 'One-Time Only',
            'daily': 'Daily',
            'weekdays': 'Weekdays',
            'weekends': 'Weekends',
            'monday': 'Mondays',
            'tuesday': 'Tuesdays',
            'wednesday': 'Wednesdays',
            'thursday': 'Thursdays',
            'friday': 'Fridays',
            'saturday': 'Saturdays',
            'sunday': 'Sundays'
        };
        return displayNames[recurrence] || recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
    }
    
    // Demo Mode Methods
    startDemoMode() {
        if (this.isInDemoMode) return;
        
        // Hide schedule info and show warning if schedule was active
        this.hideScheduleInfoAndWarn();
        
        this.isInDemoMode = true;
        this.demoCurrentStep = 0;
        
        // Set diffusion duration to 5 seconds for demo
        this.diffusionDuration = 5; // Set directly to avoid double warning
        this.updateSliderDisplay();
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