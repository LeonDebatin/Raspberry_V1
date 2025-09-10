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
        this.loadStatus();
        
        // Restore state if page was reloaded
        this.restoreStateAfterReload();
        
        // Force initial position reset
        setTimeout(() => this.resetButtonPositions(), 200);
    }
    
    initializeElements() {
        this.formulaBtns = document.querySelectorAll('.dot');
        this.offBtn = document.getElementById('off-btn');
        this.configBtns = document.querySelectorAll('.config-btn');
        this.statusText = document.getElementById('status-text');
        this.statusDot = document.getElementById('status-dot');
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
            
            // Force position reset or page reload after activation
            if (this.usePageReload) {
                setTimeout(() => this.forcePageReload(), 500);
            } else {
                setTimeout(() => this.resetButtonPositions(), 100);
            }
            
            window.notifications.success(
                `${getFormulaDisplayName(color)} formula activated (${this.cycleTime}s cycle, ${this.duration}s duration)`
            );
            
        } catch (error) {
            console.error('Error activating formula:', error);
            this.updateStatus('Error', false);
            window.notifications.error(`Failed to activate formula: ${error.message}`);
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
            
            // Force position reset or page reload after deactivation
            if (this.usePageReload) {
                setTimeout(() => this.forcePageReload(), 500);
            } else {
                setTimeout(() => this.resetButtonPositions(), 100);
            }
            
            window.notifications.success('All formulas deactivated');
            
        } catch (error) {
            console.error('Error deactivating formulas:', error);
            this.updateStatus('Error', false);
            window.notifications.error(`Failed to deactivate formulas: ${error.message}`);
        }
    }
    
    setCycleTime(time) {
        this.cycleTime = time;
        
        // If currently active, reactivate with new settings
        if (this.isActive && this.selectedFormula) {
            this.selectFormula(this.selectedFormula);
        }
    }
    
    setDuration(time) {
        this.duration = time;
        
        // If currently active, reactivate with new settings
        if (this.isActive && this.selectedFormula) {
            this.selectFormula(this.selectedFormula);
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
        
        // Force reset all button positions after state change
        this.resetButtonPositions();
    }

    resetButtonPositions() {
        // Force all buttons back to their exact mathematical positions
        this.formulaBtns.forEach(btn => {
            // Remove any inline styles that might have been added
            btn.style.transform = '';
            btn.style.left = '';
            btn.style.top = '';
            btn.style.position = '';
            btn.style.width = '';
            btn.style.height = '';
            btn.style.translate = '';
            
            // Force reflow to ensure positions are recalculated
            btn.offsetHeight;
            
            // Ensure classes are properly applied
            if (!btn.classList.contains('dot')) {
                btn.classList.add('dot');
            }
        });
        
        // Force a complete layout recalculation
        const radial = document.querySelector('.radial');
        if (radial) {
            radial.offsetHeight;
            // Force repaint
            radial.style.display = 'none';
            radial.offsetHeight;
            radial.style.display = '';
        }
    }

    // Alternative: Force page reload if positions are still problematic
    forcePageReload() {
        // Save current state before reload
        const currentState = {
            selectedFormula: this.selectedFormula,
            isActive: this.isActive,
            cycleTime: this.cycleTime,
            duration: this.duration
        };
        
        // Store in sessionStorage to restore after reload
        sessionStorage.setItem('selectionState', JSON.stringify(currentState));
        
        // Reload the page
        window.location.reload();
    }

    // Restore state after page reload
    restoreStateAfterReload() {
        const savedState = sessionStorage.getItem('selectionState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.selectedFormula = state.selectedFormula;
                this.isActive = state.isActive;
                this.cycleTime = state.cycleTime;
                this.duration = state.duration;
                
                // Update UI to reflect restored state
                this.updateFormulaButtons();
                this.updateConfigButtons();
                
                if (this.isActive && this.selectedFormula) {
                    this.updateStatus(`${getFormulaDisplayName(this.selectedFormula)} Active`, true);
                } else {
                    this.updateStatus('Ready', false);
                }
                
                // Clear the saved state
                sessionStorage.removeItem('selectionState');
            } catch (error) {
                console.error('Error restoring state:', error);
            }
        }
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
            } else {
                this.updateStatus('Ready', false);
            }
            
        } catch (error) {
            console.error('Error loading status:', error);
            this.updateStatus('Connection Error', false);
        }
    }
    
    // Auto-refresh status every 30 seconds
    startStatusPolling() {
        setInterval(() => {
            this.loadStatus();
        }, 30000);
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