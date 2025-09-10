// Global app utilities and shared functionality

class NotificationManager {
    constructor() {
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notification-text');
        this.notificationClose = document.getElementById('notification-close');
        
        if (this.notificationClose) {
            this.notificationClose.addEventListener('click', () => this.hide());
        }
    }
    
    show(message, type = 'success', duration = 5000) {
        if (!this.notification) return;
        
        this.notificationText.textContent = message;
        this.notification.className = `notification ${type}`;
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => this.hide(), duration);
        }
    }
    
    hide() {
        if (this.notification) {
            this.notification.classList.add('hidden');
        }
    }
    
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }
    
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }
    
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
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
        red: 'Crimson',
        blue: 'Azure',
        yellow: 'Amber',
        green: 'Sage'
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