// Zovatu Billing Tool - Main JavaScript File
// Core functionality and utilities

// Global App Configuration
const ZovatuApp = {
    version: '1.0.0',
    name: 'Zovatu Billing Tool',
    storagePrefix: 'zovatu_',
    currentUser: null,
    settings: {},
    
    // Initialize the application
    init() {
        console.log(`${this.name} v${this.version} - Initializing...`);
        this.loadSettings();
        this.setupEventListeners();
        this.checkAuthentication();
        this.registerServiceWorker();
    },

    // Load application settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem(this.storagePrefix + 'settings');
        this.settings = savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();
        this.applySettings();
    },

    // Get default application settings
    getDefaultSettings() {
        return {
            currency: {
                symbol: '$',
                position: 'before', // 'before' or 'after'
                decimals: 2
            },
            business: {
                name: 'Your Business Name',
                address: '',
                phone: '',
                email: '',
                logo: ''
            },
            invoice: {
                prefix: 'INV',
                startNumber: 1,
                taxRate: 0,
                defaultDiscount: 0
            },
            printer: {
                defaultSize: 'A4', // 'A4', '58mm', '80mm'
                autoprint: false
            },
            theme: {
                mode: 'light', // 'light' or 'dark'
                primaryColor: '#3b82f6'
            },
            notifications: {
                lowStock: true,
                lowStockThreshold: 10,
                expiredProducts: true
            },
            backup: {
                autoBackup: true,
                backupInterval: 24 // hours
            }
        };
    },

    // Apply settings to the application
    applySettings() {
        // Apply theme
        if (this.settings.theme.mode === 'dark') {
            document.body.classList.add('dark-mode');
        }
        
        // Apply primary color
        document.documentElement.style.setProperty('--primary-color', this.settings.theme.primaryColor);
    },

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem(this.storagePrefix + 'settings', JSON.stringify(this.settings));
    },

    // Setup global event listeners
    setupEventListeners() {
        // Handle logout buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.logout-btn')) {
                this.logout();
            }
        });

        // Handle mobile menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.mobile-menu-toggle')) {
                this.toggleMobileMenu();
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle window resize for responsive behavior
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    },

    // Check if user is authenticated
    checkAuthentication() {
        const savedUser = localStorage.getItem(this.storagePrefix + 'currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUserInterface();
        } else {
            // Redirect to login if not authenticated and not on login page
            if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
                // For now, we'll assume index.html is the main page
                // In a real app, you might redirect to a login page
            }
        }
    },

    // Update user interface based on current user
    updateUserInterface() {
        const userElements = document.querySelectorAll('.user-name');
        userElements.forEach(el => {
            el.textContent = this.currentUser ? this.currentUser.name : 'Guest';
        });
    },

    // Handle user logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem(this.storagePrefix + 'currentUser');
            this.currentUser = null;
            window.location.href = 'index.html';
        }
    },

    // Toggle mobile menu
    toggleMobileMenu() {
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    },

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // F1 - Print (if on invoice page)
        if (e.key === 'F1') {
            e.preventDefault();
            if (window.location.pathname.includes('invoices.html')) {
                this.triggerPrint();
            }
        }

        // Ctrl+S - Save (prevent default and trigger app save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.triggerSave();
        }

        // Escape - Close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
    },

    // Handle window resize
    handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth >= 768) {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.remove('mobile-open');
            }
        }
    },

    // Trigger print functionality
    triggerPrint() {
        if (typeof window.printInvoice === 'function') {
            window.printInvoice();
        } else {
            window.print();
        }
    },

    // Trigger save functionality
    triggerSave() {
        // Dispatch a custom save event that pages can listen to
        document.dispatchEvent(new CustomEvent('app:save'));
    },

    // Close all open modals
    closeModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    },

    // Register service worker for PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    },

    // Utility function to format currency
    formatCurrency(amount) {
        const { symbol, position, decimals } = this.settings.currency;
        const formattedAmount = parseFloat(amount).toFixed(decimals);
        
        if (position === 'before') {
            return `${symbol}${formattedAmount}`;
        } else {
            return `${formattedAmount}${symbol}`;
        }
    },

    // Utility function to format date
    formatDate(date, format = 'YYYY-MM-DD') {
        if (typeof dayjs !== 'undefined') {
            return dayjs(date).format(format);
        } else {
            // Fallback if dayjs is not available
            return new Date(date).toLocaleDateString();
        }
    },

    // Utility function to generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Utility function to show notifications
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Handle close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    },

    // Remove notification
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    // Utility function to validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Utility function to validate phone
    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    // Utility function to debounce function calls
    debounce(func, wait) {
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
};

// Data Storage Manager
const DataManager = {
    // Get data from localStorage
    get(key) {
        try {
            const data = localStorage.getItem(ZovatuApp.storagePrefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting data:', error);
            return null;
        }
    },

    // Set data to localStorage
    set(key, data) {
        try {
            localStorage.setItem(ZovatuApp.storagePrefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error setting data:', error);
            return false;
        }
    },

    // Remove data from localStorage
    remove(key) {
        try {
            localStorage.removeItem(ZovatuApp.storagePrefix + key);
            return true;
        } catch (error) {
            console.error('Error removing data:', error);
            return false;
        }
    },

    // Clear all app data
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(ZovatuApp.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    },

    // Export all data
    export() {
        const data = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(ZovatuApp.storagePrefix)) {
                const cleanKey = key.replace(ZovatuApp.storagePrefix, '');
                data[cleanKey] = this.get(cleanKey);
            }
        });
        return data;
    },

    // Import data
    import(data) {
        try {
            Object.keys(data).forEach(key => {
                this.set(key, data[key]);
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ZovatuApp.init();
});

// Export for use in other modules
window.ZovatuApp = ZovatuApp;
window.DataManager = DataManager;

