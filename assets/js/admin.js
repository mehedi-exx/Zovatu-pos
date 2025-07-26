// Zovatu Billing Tool - Admin Panel JavaScript
// Handles admin authentication, system management, and security features

class AdminManager {
    constructor() {
        this.defaultPin = '1234';
        this.sessionTimeout = 30; // minutes
        this.sessionTimer = null;
        this.startTime = Date.now();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAdminAccess();
        this.updateSystemInfo();
        this.startSessionTimer();
    }

    setupEventListeners() {
        // PIN Login Form
        const pinLoginForm = document.getElementById('pinLoginForm');
        if (pinLoginForm) {
            pinLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePinLogin();
            });
        }

        // Admin PIN input - auto-submit on 4 digits
        const adminPinInput = document.getElementById('adminPin');
        if (adminPinInput) {
            adminPinInput.addEventListener('input', (e) => {
                if (e.target.value.length === 4) {
                    setTimeout(() => this.handlePinLogin(), 100);
                }
            });
        }

        // Admin Actions
        document.getElementById('exportAllBtn')?.addEventListener('click', () => this.exportAllData());
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.openImportDataModal());
        document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAllData());
        document.getElementById('changePinBtn')?.addEventListener('click', () => this.openChangePinModal());
        document.getElementById('viewLogsBtn')?.addEventListener('click', () => this.openAccessLogsModal());

        // Session Timeout
        document.getElementById('sessionTimeout')?.addEventListener('change', (e) => {
            this.sessionTimeout = parseInt(e.target.value);
            this.saveAdminSettings();
            this.startSessionTimer();
        });

        // Change PIN Form
        const changePinForm = document.getElementById('changePinForm');
        if (changePinForm) {
            changePinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleChangePIN();
            });
        }

        // Import Data
        document.getElementById('confirmImportBtn')?.addEventListener('click', () => this.handleImportData());

        // Clear Logs
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => this.clearAccessLogs());

        // Activity tracking for session timeout
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetSessionTimer(), true);
        });
    }

    checkAdminAccess() {
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (isLoggedIn === 'true') {
            this.showAdminPanel();
        } else {
            this.showPinLogin();
        }
    }

    handlePinLogin() {
        const enteredPin = document.getElementById('adminPin').value;
        const storedPin = localStorage.getItem('adminPin') || this.defaultPin;

        if (enteredPin === storedPin) {
            this.loginSuccess();
        } else {
            this.loginFailed();
        }
    }

    loginSuccess() {
        sessionStorage.setItem('adminLoggedIn', 'true');
        this.logAccess('Login Success');
        this.showAdminPanel();
        ZovatuApp.showNotification('Admin access granted', 'success');
    }

    loginFailed() {
        this.logAccess('Login Failed');
        ZovatuApp.showNotification('Invalid PIN. Please try again.', 'error');
        document.getElementById('adminPin').value = '';
        document.getElementById('adminPin').focus();
    }

    showPinLogin() {
        document.getElementById('pinLoginModal').style.display = 'flex';
        document.getElementById('adminSidebar').style.display = 'none';
        document.getElementById('adminMainContent').style.display = 'none';
        setTimeout(() => document.getElementById('adminPin').focus(), 100);
    }

    showAdminPanel() {
        document.getElementById('pinLoginModal').style.display = 'none';
        document.getElementById('adminSidebar').style.display = 'flex';
        document.getElementById('adminMainContent').style.display = 'flex';
        this.loadAdminData();
        this.updateSystemStats();
    }

    logout() {
        sessionStorage.removeItem('adminLoggedIn');
        this.logAccess('Logout');
        this.stopSessionTimer();
        window.location.href = 'index.html';
    }

    loadAdminData() {
        this.loadAdminSettings();
        this.updateDataOverview();
        this.updateSystemStats();
    }

    loadAdminSettings() {
        const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        
        // Load session timeout
        if (settings.sessionTimeout) {
            this.sessionTimeout = settings.sessionTimeout;
            const timeoutSelect = document.getElementById('sessionTimeout');
            if (timeoutSelect) {
                timeoutSelect.value = this.sessionTimeout;
            }
        }
    }

    saveAdminSettings() {
        const settings = {
            sessionTimeout: this.sessionTimeout,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('adminSettings', JSON.stringify(settings));
    }

    updateSystemStats() {
        // Database Size
        const databaseSize = this.calculateDatabaseSize();
        document.getElementById('databaseSize').textContent = this.formatBytes(databaseSize);

        // System Uptime
        const uptime = Date.now() - this.startTime;
        document.getElementById('systemUptime').textContent = this.formatUptime(uptime);

        // Last Backup
        const lastBackup = localStorage.getItem('lastBackupDate');
        document.getElementById('lastBackup').textContent = lastBackup ? 
            ZovatuApp.formatDate(lastBackup, 'MMM DD, YYYY') : 'Never';
    }

    updateSystemInfo() {
        // Browser Info
        document.getElementById('browserInfo').textContent = this.getBrowserInfo();
        
        // Screen Resolution
        document.getElementById('screenResolution').textContent = 
            `${screen.width} × ${screen.height}`;
        
        // Local Storage Support
        document.getElementById('localStorageSupport').textContent = 
            typeof(Storage) !== "undefined" ? 'Supported' : 'Not Supported';
        
        // PWA Support
        document.getElementById('pwaSupport').textContent = 
            'serviceWorker' in navigator ? 'Supported' : 'Not Supported';
        
        // Installation Date
        const installDate = localStorage.getItem('installationDate') || new Date().toISOString();
        if (!localStorage.getItem('installationDate')) {
            localStorage.setItem('installationDate', installDate);
        }
        document.getElementById('installationDate').textContent = 
            ZovatuApp.formatDate(installDate, 'MMM DD, YYYY');
    }

    updateDataOverview() {
        const dataTypes = [
            { name: 'Products', key: 'products', icon: 'fas fa-box' },
            { name: 'Customers', key: 'customers', icon: 'fas fa-users' },
            { name: 'Invoices', key: 'invoices', icon: 'fas fa-file-invoice' },
            { name: 'Settings', key: 'settings', icon: 'fas fa-cog' },
            { name: 'Admin Logs', key: 'adminLogs', icon: 'fas fa-history' }
        ];

        const tbody = document.getElementById('dataOverviewBody');
        if (!tbody) return;

        tbody.innerHTML = dataTypes.map(type => {
            const data = JSON.parse(localStorage.getItem(type.key) || '[]');
            const size = JSON.stringify(data).length;
            const lastModified = localStorage.getItem(`${type.key}_lastModified`) || 'Never';

            return `
                <tr>
                    <td>
                        <div class="flex items-center">
                            <i class="${type.icon} text-blue-600 mr-2"></i>
                            ${type.name}
                        </div>
                    </td>
                    <td>${Array.isArray(data) ? data.length : 'N/A'}</td>
                    <td>${this.formatBytes(size)}</td>
                    <td>${lastModified !== 'Never' ? ZovatuApp.formatDate(lastModified, 'MMM DD, HH:mm') : 'Never'}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="adminManager.exportData('${type.key}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ml-1" onclick="adminManager.clearData('${type.key}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Data Management Methods
    exportAllData() {
        const allData = {
            products: DataManager.get('products') || [],
            customers: DataManager.get('customers') || [],
            invoices: DataManager.get('invoices') || [],
            settings: DataManager.get('settings') || {},
            adminLogs: JSON.parse(localStorage.getItem('adminLogs') || '[]'),
            exportDate: new Date().toISOString(),
            version: 'Zovatu v2.0'
        };

        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zovatu-backup-${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD-HHmm')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.logAccess('Data Export - All');
        ZovatuApp.showNotification('All data exported successfully', 'success');
    }

    exportData(dataType) {
        const data = JSON.parse(localStorage.getItem(dataType) || '[]');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zovatu-${dataType}-${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.logAccess(`Data Export - ${dataType}`);
        ZovatuApp.showNotification(`${dataType} data exported successfully`, 'success');
    }

    openImportDataModal() {
        document.getElementById('importDataModal').style.display = 'flex';
    }

    closeImportDataModal() {
        document.getElementById('importDataModal').style.display = 'none';
        document.getElementById('importFile').value = '';
    }

    handleImportData() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];

        if (!file) {
            ZovatuApp.showNotification('Please select a file to import', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.importData(data);
            } catch (error) {
                ZovatuApp.showNotification('Invalid backup file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    importData(data) {
        try {
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            // Import each data type
            if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
            if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
            if (data.invoices) localStorage.setItem('invoices', JSON.stringify(data.invoices));
            if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));

            this.logAccess('Data Import - Success');
            this.closeImportDataModal();
            this.updateDataOverview();
            ZovatuApp.showNotification('Data imported successfully', 'success');
            
            // Refresh page to apply changes
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            this.logAccess('Data Import - Failed');
            ZovatuApp.showNotification('Failed to import data: ' + error.message, 'error');
        }
    }

    clearAllData() {
        if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
            return;
        }

        const confirmText = prompt('Type "DELETE ALL" to confirm:');
        if (confirmText !== 'DELETE ALL') {
            ZovatuApp.showNotification('Data clear cancelled', 'info');
            return;
        }

        // Clear all data except admin settings
        const keysToKeep = ['adminPin', 'adminSettings', 'adminLogs', 'installationDate'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        this.logAccess('Data Clear - All');
        this.updateDataOverview();
        ZovatuApp.showNotification('All data cleared successfully', 'success');
    }

    clearData(dataType) {
        if (!confirm(`Are you sure you want to clear all ${dataType} data?`)) {
            return;
        }

        localStorage.removeItem(dataType);
        localStorage.removeItem(`${dataType}_lastModified`);
        
        this.logAccess(`Data Clear - ${dataType}`);
        this.updateDataOverview();
        ZovatuApp.showNotification(`${dataType} data cleared successfully`, 'success');
    }

    // PIN Management
    openChangePinModal() {
        document.getElementById('changePinModal').style.display = 'flex';
        setTimeout(() => document.getElementById('currentPin').focus(), 100);
    }

    closeChangePinModal() {
        document.getElementById('changePinModal').style.display = 'none';
        document.getElementById('changePinForm').reset();
    }

    handleChangePIN() {
        const currentPin = document.getElementById('currentPin').value;
        const newPin = document.getElementById('newPin').value;
        const confirmPin = document.getElementById('confirmPin').value;
        const storedPin = localStorage.getItem('adminPin') || this.defaultPin;

        // Validate current PIN
        if (currentPin !== storedPin) {
            ZovatuApp.showNotification('Current PIN is incorrect', 'error');
            return;
        }

        // Validate new PIN
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            ZovatuApp.showNotification('New PIN must be exactly 4 digits', 'error');
            return;
        }

        // Validate PIN confirmation
        if (newPin !== confirmPin) {
            ZovatuApp.showNotification('New PIN confirmation does not match', 'error');
            return;
        }

        // Save new PIN
        localStorage.setItem('adminPin', newPin);
        this.logAccess('PIN Changed');
        this.closeChangePinModal();
        ZovatuApp.showNotification('Admin PIN changed successfully', 'success');
    }

    // Access Logs
    logAccess(action) {
        const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            ipAddress: 'Local',
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        logs.unshift(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('adminLogs', JSON.stringify(logs));
    }

    openAccessLogsModal() {
        const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
        const tbody = document.getElementById('accessLogsBody');
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">No access logs found</td></tr>';
        } else {
            tbody.innerHTML = logs.map(log => `
                <tr>
                    <td>${ZovatuApp.formatDate(log.timestamp, 'MMM DD, YYYY HH:mm:ss')}</td>
                    <td>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.action.includes('Failed') ? 'bg-red-100 text-red-800' :
                            log.action.includes('Success') || log.action.includes('Login') ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                        }">
                            ${log.action}
                        </span>
                    </td>
                    <td>${log.ipAddress}</td>
                    <td class="text-sm text-gray-500">${log.userAgent}</td>
                </tr>
            `).join('');
        }
        
        document.getElementById('accessLogsModal').style.display = 'flex';
    }

    closeAccessLogsModal() {
        document.getElementById('accessLogsModal').style.display = 'none';
    }

    clearAccessLogs() {
        if (!confirm('Are you sure you want to clear all access logs?')) {
            return;
        }

        localStorage.removeItem('adminLogs');
        this.logAccess('Logs Cleared');
        this.closeAccessLogsModal();
        ZovatuApp.showNotification('Access logs cleared successfully', 'success');
    }

    // Session Management
    startSessionTimer() {
        this.stopSessionTimer();
        
        if (this.sessionTimeout > 0) {
            this.sessionTimer = setTimeout(() => {
                ZovatuApp.showNotification('Session expired. Please login again.', 'warning');
                this.logout();
            }, this.sessionTimeout * 60 * 1000);
        }
    }

    stopSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    resetSessionTimer() {
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            this.startSessionTimer();
        }
    }

    // Utility Methods
    calculateDatabaseSize() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return totalSize;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';
        
        return browser;
    }
}

// Global functions for modal management
function closeChangePinModal() {
    if (window.adminManager) {
        window.adminManager.closeChangePinModal();
    }
}

function closeImportDataModal() {
    if (window.adminManager) {
        window.adminManager.closeImportDataModal();
    }
}

function closeAccessLogsModal() {
    if (window.adminManager) {
        window.adminManager.closeAccessLogsModal();
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

// Export for use in other modules
window.AdminManager = AdminManager;

