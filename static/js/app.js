// Global app utilities and shared functionality

class NotificationManager {
    constructor() {
        // Notifications disabled - no DOM elements needed
        this.notification = null;
        this.notificationText = null;
        this.notificationClose = null;
    }
    
    show(message, type = 'success', duration = 5000) {
        // Notifications disabled - do nothing
        console.log(`Notification (${type}): ${message}`);
    }
    
    hide() {
        // Notifications disabled - do nothing
    }
    
    success(message, duration = 3000) {
        console.log(`Success: ${message}`);
    }
    
    error(message, duration = 5000) {
        console.log(`Error: ${message}`);
    }
    
    warning(message, duration = 4000) {
        console.log(`Warning: ${message}`);
    }
}

class ApiClient {
    constructor() {
        this.baseUrl = '';
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Global instances
window.notifications = new NotificationManager();
window.api = new ApiClient();

// Utility functions
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function getFormulaDisplayName(color) {
    const names = {
        red: 'Floral',
        blue: 'Fresh',
        yellow: 'Amber',
        green: 'Woody'
    };
    return names[color] || color;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading states to buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('button[type="submit"]') || e.target.matches('.btn-primary')) {
            e.target.classList.add('loading');
            setTimeout(() => {
                e.target.classList.remove('loading');
            }, 2000);
        }
    });
    
    // Add focus management for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) {
                const closeBtn = openModal.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            }
        }
    });
});

// Mobile-specific enhancements
class MobileEnhancements {
    constructor() {
        this.init();
    }
    
    init() {
        this.addTouchFeedback();
        this.preventZoom();
        this.addSwipeGestures();
        this.optimizeScrolling();
    }
    
    addTouchFeedback() {
        // Add haptic feedback for supported devices
        document.addEventListener('touchstart', (e) => {
            // EXCLUDE dots to prevent movement
            if (e.target.matches('.config-btn, .view-btn, .btn-primary, .btn-secondary, .btn-danger')) {
                // Vibrate for 10ms on supported devices
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
                
                // Add visual feedback (NOT for dots)
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            }
            
            // Haptic feedback for dots but NO visual transform
            if (e.target.matches('.dot')) {
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }
        });
    }
    
    preventZoom() {
        // Prevent double-tap zoom on buttons
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                if (e.target.matches('.dot, .config-btn, .view-btn, button')) {
                    e.preventDefault();
                }
            }
            lastTouchEnd = now;
        }, false);
    }
    
    addSwipeGestures() {
        let startX = 0;
        let startY = 0;
        
        // Add swipe navigation for calendar views
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer) {
            calendarContainer.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            calendarContainer.addEventListener('touchend', (e) => {
                if (!startX || !startY) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Only trigger if horizontal swipe is dominant
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // Swipe left - next period
                        const nextBtn = document.getElementById('next-period');
                        if (nextBtn) nextBtn.click();
                    } else {
                        // Swipe right - previous period
                        const prevBtn = document.getElementById('prev-period');
                        if (prevBtn) prevBtn.click();
                    }
                }
                
                startX = 0;
                startY = 0;
            });
        }
    }
    
    optimizeScrolling() {
        // Smooth scrolling for mobile
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Prevent overscroll bounce on iOS
        document.body.style.overscrollBehavior = 'none';
        
        // Optimize scroll performance
        const scrollElements = document.querySelectorAll('.calendar-container, .modal-content');
        scrollElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
        });
    }
}

// Burger Menu Navigation
class BurgerMenu {
    constructor() {
        this.burgerMenu = document.getElementById('burger-menu');
        this.navLinks = document.getElementById('nav-links');
        this.navOverlay = document.getElementById('nav-overlay');
        this.isOpen = false;
        
        if (this.burgerMenu && this.navLinks && this.navOverlay) {
            this.init();
        }
    }
    
    init() {
        // Burger menu click handler
        this.burgerMenu.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
        
        // Overlay click handler (close menu)
        this.navOverlay.addEventListener('click', () => {
            this.close();
        });
        
        // Navigation link click handler (close menu on mobile)
        this.navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                // Close menu when a nav link is clicked on mobile
                if (window.innerWidth <= 768) {
                    setTimeout(() => this.close(), 150);
                }
            });
        });
        
        // Close menu on window resize if it gets too wide
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.close();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.burgerMenu.classList.add('active');
        this.navLinks.classList.add('active');
        this.navOverlay.classList.add('active');
        
        // Prevent body scrolling when menu is open
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.isOpen = false;
        this.burgerMenu.classList.remove('active');
        this.navLinks.classList.remove('active');
        this.navOverlay.classList.remove('active');
        
        // Restore body scrolling
        document.body.style.overflow = '';
    }
}

// Initialize mobile enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize burger menu navigation
    new BurgerMenu();
    
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                    || window.innerWidth <= 768;
    
    if (isMobile) {
        new MobileEnhancements();
        
        // Add mobile class to body for additional styling hooks
        document.body.classList.add('mobile-device');
        
        // Optimize viewport for mobile
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0');
        }
    }
});