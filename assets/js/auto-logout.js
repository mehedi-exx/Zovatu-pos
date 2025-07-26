// Zovatu Billing Tool - Auto Logout Timer
// Handles automatic logout after inactivity period

class AutoLogout {
    constructor() {
        this.timeoutDuration = 30 * 60 * 1000; // 30 minutes default
        this.warningDuration = 5 * 60 * 1000; // 5 minutes warning
        this.timeoutId = null;
        this.warningId = null;
        this.isWarningShown = false;
        this.isEnabled = true;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.createWarningModal();
        this.startTimer();
    }

    loadSettings() {
        const settings = DataManager.get('settings') || {};
        const systemSettings = settings.system || {};
        
        this.isEnabled = systemSettings.autoLogout !== false;
        this.timeoutDuration = (systemSettings.logoutTimeout || 30) * 60 * 1000;
        this.warningDuration = Math.min(5 * 60 * 1000, this.timeoutDuration / 6);
    }

    setupEventListeners() {
        // Events that indicate user activity
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'focus', 'blur'
        ];

        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetTimer();
            }, true);
        });

        // Listen for settings changes
        document.addEventListener('settingsUpdated', () => {
            this.loadSettings();
            this.resetTimer();
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resetTimer();
            }
        });
    }

    createWarningModal() {
        const warningHTML = `
            <div id="logoutWarningModal" class="modal" style="display: none;">
                <div class="modal-content max-w-md">
                    <div class="modal-header bg-yellow-50">
                        <h3 class="modal-title text-yellow-800">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            Session Timeout Warning
                        </h3>
                    </div>
                    <div class="modal-body">
                        <div class="text-center">
                            <div class="mb-4">
                                <i class="fas fa-clock text-yellow-500 text-4xl mb-3"></i>
                                <p class="text-gray-700 mb-2">Your session will expire in:</p>
                                <div class="text-3xl font-bold text-red-600" id="countdownTimer">5:00</div>
                            </div>
                            <p class="text-sm text-gray-600 mb-4">
                                Click "Stay Logged In" to continue your session, or you will be automatically logged out.
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="autoLogout.logout()">
                            <i class="fas fa-sign-out-alt mr-2"></i>Logout Now
                        </button>
                        <button type="button" class="btn btn-primary" onclick="autoLogout.extendSession()">
                            <i class="fas fa-clock mr-2"></i>Stay Logged In
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('logoutWarningModal')) {
            document.body.insertAdjacentHTML('beforeend', warningHTML);
        }
    }

    startTimer() {
        if (!this.isEnabled) return;

        this.clearTimers();

        // Set warning timer
        this.warningId = setTimeout(() => {
            this.showWarning();
        }, this.timeoutDuration - this.warningDuration);

        // Set logout timer
        this.timeoutId = setTimeout(() => {
            this.logout();
        }, this.timeoutDuration);
    }

    resetTimer() {
        if (!this.isEnabled) return;

        this.clearTimers();
        this.hideWarning();
        this.startTimer();
    }

    clearTimers() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.warningId) {
            clearTimeout(this.warningId);
            this.warningId = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    showWarning() {
        if (this.isWarningShown) return;

        this.isWarningShown = true;
        document.getElementById('logoutWarningModal').style.display = 'flex';
        
        // Start countdown
        let remainingTime = this.warningDuration / 1000; // Convert to seconds
        this.updateCountdown(remainingTime);
        
        this.countdownInterval = setInterval(() => {
            remainingTime--;
            this.updateCountdown(remainingTime);
            
            if (remainingTime <= 0) {
                this.logout();
            }
        }, 1000);

        // Play warning sound if available
        this.playWarningSound();
    }

    hideWarning() {
        this.isWarningShown = false;
        document.getElementById('logoutWarningModal').style.display = 'none';
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    updateCountdown(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const display = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('countdownTimer');
        if (timerElement) {
            timerElement.textContent = display;
            
            // Change color as time runs out
            if (seconds <= 30) {
                timerElement.className = 'text-3xl font-bold text-red-600 animate-pulse';
            } else if (seconds <= 60) {
                timerElement.className = 'text-3xl font-bold text-orange-600';
            } else {
                timerElement.className = 'text-3xl font-bold text-red-600';
            }
        }
    }

    extendSession() {
        this.hideWarning();
        this.resetTimer();
        ZovatuApp.showNotification('Session extended successfully', 'success');
    }

    logout() {
        this.clearTimers();
        this.hideWarning();
        
        // Clear all data and redirect to login
        this.performLogout();
    }

    performLogout() {
        // Save logout reason
        const logoutData = {
            reason: 'auto_logout',
            timestamp: new Date().toISOString(),
            sessionDuration: this.getSessionDuration()
        };
        
        localStorage.setItem('lastLogout', JSON.stringify(logoutData));
        
        // Clear session data but keep settings and business data
        sessionStorage.clear();
        
        // Show logout notification
        ZovatuApp.showNotification('You have been logged out due to inactivity', 'warning');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    getSessionDuration() {
        const loginTime = sessionStorage.getItem('loginTime');
        if (loginTime) {
            return Date.now() - parseInt(loginTime);
        }
        return 0;
    }

    playWarningSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Fallback: no sound if Web Audio API is not supported
            console.log('Warning sound not available');
        }
    }

    // Manual logout method
    manualLogout() {
        this.clearTimers();
        this.hideWarning();
        
        const logoutData = {
            reason: 'manual_logout',
            timestamp: new Date().toISOString(),
            sessionDuration: this.getSessionDuration()
        };
        
        localStorage.setItem('lastLogout', JSON.stringify(logoutData));
        sessionStorage.clear();
        
        window.location.href = 'index.html';
    }

    // Enable/disable auto logout
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.startTimer();
        } else {
            this.clearTimers();
            this.hideWarning();
        }
    }

    // Update timeout duration
    setTimeout(minutes) {
        this.timeoutDuration = minutes * 60 * 1000;
        this.warningDuration = Math.min(5 * 60 * 1000, this.timeoutDuration / 6);
        this.resetTimer();
    }

    // Get remaining time
    getRemainingTime() {
        // This would require tracking when the timer was started
        // For now, return the full timeout duration
        return this.timeoutDuration;
    }

    // Check if user is active
    isUserActive() {
        return !this.isWarningShown;
    }

    // Get session info
    getSessionInfo() {
        const loginTime = sessionStorage.getItem('loginTime');
        const currentTime = Date.now();
        
        return {
            loginTime: loginTime ? new Date(parseInt(loginTime)) : null,
            sessionDuration: loginTime ? currentTime - parseInt(loginTime) : 0,
            isActive: this.isUserActive(),
            timeoutDuration: this.timeoutDuration,
            isEnabled: this.isEnabled
        };
    }
}

// Initialize auto logout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is logged in (not on login page)
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.endsWith('/')) {
        window.autoLogout = new AutoLogout();
    }
});

// Export for use in other modules
window.AutoLogout = AutoLogout;

