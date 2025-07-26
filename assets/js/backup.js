// Zovatu Billing Tool - Backup & Restore JavaScript
// Handles data backup, restore, and scheduled backup functionality

class BackupManager {
    constructor() {
        this.backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        this.scheduleSettings = JSON.parse(localStorage.getItem('backupSchedule') || '{}');
        this.isBackupInProgress = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBackupStatus();
        this.loadBackupHistory();
        this.loadScheduleSettings();
        this.setupScheduledBackups();
    }

    setupEventListeners() {
        // Backup actions
        document.getElementById('createBackupBtn')?.addEventListener('click', () => this.createFullBackup());
        document.getElementById('quickBackupBtn')?.addEventListener('click', () => this.createQuickBackup());
        document.getElementById('restoreDataBtn')?.addEventListener('click', () => this.initiateRestore());
        
        // Schedule settings
        document.getElementById('enableAutoBackup')?.addEventListener('change', (e) => {
            this.toggleAutoBackup(e.target.checked);
        });
        document.getElementById('saveScheduleBtn')?.addEventListener('click', () => this.saveScheduleSettings());
        document.getElementById('runBackupNowBtn')?.addEventListener('click', () => this.runScheduledBackup());
        
        // Data management tools
        document.getElementById('exportProductsBtn')?.addEventListener('click', () => this.exportData('products'));
        document.getElementById('exportCustomersBtn')?.addEventListener('click', () => this.exportData('customers'));
        document.getElementById('exportInvoicesBtn')?.addEventListener('click', () => this.exportData('invoices'));
        
        document.getElementById('importProductsBtn')?.addEventListener('click', () => this.triggerImport('products'));
        document.getElementById('importCustomersBtn')?.addEventListener('click', () => this.triggerImport('customers'));
        
        document.getElementById('resetSystemBtn')?.addEventListener('click', () => this.resetSystem());
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => this.clearBackupHistory());
        
        // File inputs
        document.getElementById('importProductsFile')?.addEventListener('change', (e) => this.handleImport('products', e.target.files[0]));
        document.getElementById('importCustomersFile')?.addEventListener('change', (e) => this.handleImport('customers', e.target.files[0]));
        
        // Restore confirmation
        document.getElementById('confirmRestoreBtn')?.addEventListener('click', () => this.executeRestore());
    }

    updateBackupStatus() {
        // Update last backup date
        const lastBackup = this.getLastBackupDate();
        document.getElementById('lastBackupDate').textContent = lastBackup ? 
            ZovatuApp.formatDate(lastBackup, 'MMM DD, YYYY HH:mm') : 'Never';
        
        // Update total data size
        const dataSize = this.calculateTotalDataSize();
        document.getElementById('totalDataSize').textContent = this.formatBytes(dataSize);
        
        // Update backup count
        document.getElementById('backupCount').textContent = this.backupHistory.length;
    }

    createFullBackup() {
        if (this.isBackupInProgress) {
            ZovatuApp.showNotification('Backup already in progress', 'warning');
            return;
        }

        const includeProducts = document.getElementById('includeProducts').checked;
        const includeCustomers = document.getElementById('includeCustomers').checked;
        const includeInvoices = document.getElementById('includeInvoices').checked;
        const includeSettings = document.getElementById('includeSettings').checked;

        this.createBackup({
            products: includeProducts,
            customers: includeCustomers,
            invoices: includeInvoices,
            settings: includeSettings
        }, 'full');
    }

    createQuickBackup() {
        if (this.isBackupInProgress) {
            ZovatuApp.showNotification('Backup already in progress', 'warning');
            return;
        }

        // Quick backup includes all essential data
        this.createBackup({
            products: true,
            customers: true,
            invoices: true,
            settings: true
        }, 'quick');
    }

    createBackup(options, type = 'manual') {
        this.isBackupInProgress = true;
        this.showBackupProgress();

        const backupData = {
            metadata: {
                version: 'Zovatu v2.0',
                type: type,
                timestamp: new Date().toISOString(),
                options: options
            },
            data: {}
        };

        let progress = 0;
        const totalSteps = Object.values(options).filter(Boolean).length;
        const stepSize = 100 / totalSteps;

        // Collect data based on options
        if (options.products) {
            this.updateBackupProgress('Backing up products...', progress);
            backupData.data.products = DataManager.get('products') || [];
            progress += stepSize;
        }

        if (options.customers) {
            this.updateBackupProgress('Backing up customers...', progress);
            backupData.data.customers = DataManager.get('customers') || [];
            progress += stepSize;
        }

        if (options.invoices) {
            this.updateBackupProgress('Backing up invoices...', progress);
            backupData.data.invoices = DataManager.get('invoices') || [];
            progress += stepSize;
        }

        if (options.settings) {
            this.updateBackupProgress('Backing up settings...', progress);
            backupData.data.settings = DataManager.get('settings') || {};
            progress += stepSize;
        }

        // Simulate processing time for better UX
        setTimeout(() => {
            this.updateBackupProgress('Finalizing backup...', 90);
            
            setTimeout(() => {
                this.downloadBackup(backupData, type);
                this.recordBackupHistory(backupData);
                this.updateBackupProgress('Backup completed!', 100);
                
                setTimeout(() => {
                    this.hideBackupProgress();
                    this.isBackupInProgress = false;
                    this.updateBackupStatus();
                    ZovatuApp.showNotification('Backup created successfully', 'success');
                }, 1000);
            }, 500);
        }, 1000);
    }

    downloadBackup(backupData, type) {
        const filename = `zovatu-${type}-backup-${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD-HHmm')}.json`;
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        
        if (window.saveAs) {
            // Use FileSaver.js if available
            saveAs(blob, filename);
        } else {
            // Fallback method
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    recordBackupHistory(backupData) {
        const historyEntry = {
            id: Date.now(),
            timestamp: backupData.metadata.timestamp,
            type: backupData.metadata.type,
            size: JSON.stringify(backupData).length,
            records: this.countRecords(backupData.data),
            status: 'completed',
            options: backupData.metadata.options
        };

        this.backupHistory.unshift(historyEntry);
        
        // Keep only last 50 backups in history
        if (this.backupHistory.length > 50) {
            this.backupHistory = this.backupHistory.slice(0, 50);
        }

        localStorage.setItem('backupHistory', JSON.stringify(this.backupHistory));
        localStorage.setItem('lastBackupDate', backupData.metadata.timestamp);
        
        this.loadBackupHistory();
    }

    loadBackupHistory() {
        const tbody = document.getElementById('backupHistoryBody');
        if (!tbody) return;

        if (this.backupHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500">No backup history found</td></tr>';
            return;
        }

        tbody.innerHTML = this.backupHistory.map(backup => `
            <tr>
                <td>${ZovatuApp.formatDate(backup.timestamp, 'MMM DD, YYYY HH:mm')}</td>
                <td>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        backup.type === 'full' ? 'bg-blue-100 text-blue-800' :
                        backup.type === 'quick' ? 'bg-green-100 text-green-800' :
                        backup.type === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                    }">
                        ${backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}
                    </span>
                </td>
                <td>${this.formatBytes(backup.size)}</td>
                <td>${backup.records}</td>
                <td>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                        backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">
                        ${backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary mr-1" onclick="backupManager.downloadBackupFromHistory(${backup.id})">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="backupManager.deleteBackupFromHistory(${backup.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    initiateRestore() {
        const fileInput = document.getElementById('restoreFile');
        const file = fileInput.files[0];

        if (!file) {
            ZovatuApp.showNotification('Please select a backup file to restore', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                this.showRestoreConfirmation(backupData);
            } catch (error) {
                ZovatuApp.showNotification('Invalid backup file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    showRestoreConfirmation(backupData) {
        const preview = document.getElementById('restorePreview');
        const records = this.countRecords(backupData.data);
        
        preview.innerHTML = `
            <h4 class="font-medium text-gray-900 mb-3">Backup Information</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p><strong>Version:</strong> ${backupData.metadata?.version || 'Unknown'}</p>
                    <p><strong>Type:</strong> ${backupData.metadata?.type || 'Unknown'}</p>
                    <p><strong>Date:</strong> ${ZovatuApp.formatDate(backupData.metadata?.timestamp, 'MMM DD, YYYY HH:mm')}</p>
                </div>
                <div>
                    <p><strong>Total Records:</strong> ${records}</p>
                    <p><strong>Products:</strong> ${backupData.data.products?.length || 0}</p>
                    <p><strong>Customers:</strong> ${backupData.data.customers?.length || 0}</p>
                    <p><strong>Invoices:</strong> ${backupData.data.invoices?.length || 0}</p>
                </div>
            </div>
        `;

        this.pendingRestoreData = backupData;
        document.getElementById('restoreConfirmModal').style.display = 'flex';
    }

    executeRestore() {
        if (!this.pendingRestoreData) {
            ZovatuApp.showNotification('No restore data available', 'error');
            return;
        }

        const restoreMode = document.querySelector('input[name="restoreMode"]:checked').value;
        
        try {
            if (restoreMode === 'replace') {
                // Replace all data
                if (this.pendingRestoreData.data.products) {
                    DataManager.set('products', this.pendingRestoreData.data.products);
                }
                if (this.pendingRestoreData.data.customers) {
                    DataManager.set('customers', this.pendingRestoreData.data.customers);
                }
                if (this.pendingRestoreData.data.invoices) {
                    DataManager.set('invoices', this.pendingRestoreData.data.invoices);
                }
                if (this.pendingRestoreData.data.settings) {
                    DataManager.set('settings', this.pendingRestoreData.data.settings);
                }
            } else {
                // Merge with existing data
                this.mergeData('products', this.pendingRestoreData.data.products);
                this.mergeData('customers', this.pendingRestoreData.data.customers);
                this.mergeData('invoices', this.pendingRestoreData.data.invoices);
                if (this.pendingRestoreData.data.settings) {
                    const existingSettings = DataManager.get('settings') || {};
                    const mergedSettings = { ...existingSettings, ...this.pendingRestoreData.data.settings };
                    DataManager.set('settings', mergedSettings);
                }
            }

            this.closeRestoreConfirmModal();
            ZovatuApp.showNotification('Data restored successfully', 'success');
            
            // Refresh page to apply changes
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (error) {
            ZovatuApp.showNotification('Failed to restore data: ' + error.message, 'error');
        }
    }

    mergeData(dataType, newData) {
        if (!newData || !Array.isArray(newData)) return;

        const existingData = DataManager.get(dataType) || [];
        const mergedData = [...existingData];

        newData.forEach(newItem => {
            const existingIndex = mergedData.findIndex(item => 
                item.id === newItem.id || 
                (dataType === 'products' && item.sku === newItem.sku) ||
                (dataType === 'customers' && item.phone === newItem.phone)
            );

            if (existingIndex >= 0) {
                // Update existing item
                mergedData[existingIndex] = { ...mergedData[existingIndex], ...newItem };
            } else {
                // Add new item
                mergedData.push(newItem);
            }
        });

        DataManager.set(dataType, mergedData);
    }

    // Scheduled Backup Methods
    loadScheduleSettings() {
        const settings = this.scheduleSettings;
        
        document.getElementById('enableAutoBackup').checked = settings.enabled || false;
        document.getElementById('backupFrequency').value = settings.frequency || 'daily';
        document.getElementById('backupTime').value = settings.time || '02:00';
        document.getElementById('backupRetention').value = settings.retention || '30';
        
        this.toggleAutoBackup(settings.enabled || false);
        this.updateNextBackupDisplay();
    }

    toggleAutoBackup(enabled) {
        const settingsDiv = document.getElementById('autoBackupSettings');
        if (settingsDiv) {
            settingsDiv.style.display = enabled ? 'block' : 'none';
        }
        
        this.scheduleSettings.enabled = enabled;
        this.updateNextBackupDisplay();
    }

    saveScheduleSettings() {
        this.scheduleSettings = {
            enabled: document.getElementById('enableAutoBackup').checked,
            frequency: document.getElementById('backupFrequency').value,
            time: document.getElementById('backupTime').value,
            retention: parseInt(document.getElementById('backupRetention').value)
        };

        localStorage.setItem('backupSchedule', JSON.stringify(this.scheduleSettings));
        this.setupScheduledBackups();
        this.updateNextBackupDisplay();
        
        ZovatuApp.showNotification('Backup schedule saved successfully', 'success');
    }

    setupScheduledBackups() {
        // Clear existing timers
        if (this.backupTimer) {
            clearTimeout(this.backupTimer);
        }

        if (!this.scheduleSettings.enabled) return;

        const nextBackupTime = this.calculateNextBackupTime();
        const timeUntilBackup = nextBackupTime - Date.now();

        if (timeUntilBackup > 0) {
            this.backupTimer = setTimeout(() => {
                this.runScheduledBackup();
                this.setupScheduledBackups(); // Schedule next backup
            }, timeUntilBackup);
        }
    }

    calculateNextBackupTime() {
        const now = new Date();
        const [hours, minutes] = this.scheduleSettings.time.split(':').map(Number);
        
        let nextBackup = new Date();
        nextBackup.setHours(hours, minutes, 0, 0);

        // If the time has passed today, schedule for tomorrow/next period
        if (nextBackup <= now) {
            switch (this.scheduleSettings.frequency) {
                case 'daily':
                    nextBackup.setDate(nextBackup.getDate() + 1);
                    break;
                case 'weekly':
                    nextBackup.setDate(nextBackup.getDate() + 7);
                    break;
                case 'monthly':
                    nextBackup.setMonth(nextBackup.getMonth() + 1);
                    break;
            }
        }

        return nextBackup.getTime();
    }

    updateNextBackupDisplay() {
        const nextDateElement = document.getElementById('nextBackupDate');
        const nextTimeElement = document.getElementById('nextBackupTime');

        if (!this.scheduleSettings.enabled) {
            nextDateElement.textContent = 'Not scheduled';
            nextTimeElement.textContent = 'Auto backup disabled';
            return;
        }

        const nextBackupTime = this.calculateNextBackupTime();
        const nextBackupDate = new Date(nextBackupTime);

        nextDateElement.textContent = ZovatuApp.formatDate(nextBackupDate, 'MMM DD, YYYY');
        nextTimeElement.textContent = `at ${ZovatuApp.formatDate(nextBackupDate, 'HH:mm')}`;
    }

    runScheduledBackup() {
        this.createBackup({
            products: true,
            customers: true,
            invoices: true,
            settings: true
        }, 'scheduled');
    }

    // Data Export/Import Methods
    exportData(dataType) {
        const data = DataManager.get(dataType) || [];
        const filename = `zovatu-${dataType}-${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        if (window.saveAs) {
            saveAs(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        ZovatuApp.showNotification(`${dataType} exported successfully`, 'success');
    }

    triggerImport(dataType) {
        document.getElementById(`import${dataType.charAt(0).toUpperCase() + dataType.slice(1)}File`).click();
    }

    handleImport(dataType, file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (Array.isArray(importedData)) {
                    this.mergeData(dataType, importedData);
                    ZovatuApp.showNotification(`${dataType} imported successfully`, 'success');
                } else {
                    ZovatuApp.showNotification('Invalid file format. Expected JSON array.', 'error');
                }
            } catch (error) {
                ZovatuApp.showNotification('Failed to import data: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    resetSystem() {
        if (!confirm('Are you sure you want to reset the entire system? This will delete ALL data and cannot be undone.')) {
            return;
        }

        const confirmText = prompt('Type "RESET SYSTEM" to confirm:');
        if (confirmText !== 'RESET SYSTEM') {
            ZovatuApp.showNotification('System reset cancelled', 'info');
            return;
        }

        // Clear all data except backup history and admin settings
        const keysToKeep = ['backupHistory', 'backupSchedule', 'adminPin', 'adminSettings', 'adminLogs'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        ZovatuApp.showNotification('System reset successfully', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    }

    clearBackupHistory() {
        if (!confirm('Are you sure you want to clear all backup history?')) {
            return;
        }

        this.backupHistory = [];
        localStorage.removeItem('backupHistory');
        localStorage.removeItem('lastBackupDate');
        
        this.loadBackupHistory();
        this.updateBackupStatus();
        
        ZovatuApp.showNotification('Backup history cleared', 'success');
    }

    // Utility Methods
    showBackupProgress() {
        document.getElementById('backupProgressModal').style.display = 'flex';
    }

    hideBackupProgress() {
        document.getElementById('backupProgressModal').style.display = 'none';
    }

    updateBackupProgress(text, percent) {
        document.getElementById('backupProgressText').textContent = text;
        document.getElementById('backupProgressBar').style.width = `${percent}%`;
        document.getElementById('backupProgressPercent').textContent = `${Math.round(percent)}%`;
    }

    closeRestoreConfirmModal() {
        document.getElementById('restoreConfirmModal').style.display = 'none';
        this.pendingRestoreData = null;
    }

    getLastBackupDate() {
        return localStorage.getItem('lastBackupDate');
    }

    calculateTotalDataSize() {
        let totalSize = 0;
        const dataTypes = ['products', 'customers', 'invoices', 'settings'];
        
        dataTypes.forEach(type => {
            const data = localStorage.getItem(type);
            if (data) {
                totalSize += data.length;
            }
        });

        return totalSize;
    }

    countRecords(data) {
        let count = 0;
        if (data.products) count += data.products.length;
        if (data.customers) count += data.customers.length;
        if (data.invoices) count += data.invoices.length;
        return count;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadBackupFromHistory(backupId) {
        // This would typically download from a stored backup file
        // For now, we'll create a new backup with current data
        ZovatuApp.showNotification('Backup download feature coming soon', 'info');
    }

    deleteBackupFromHistory(backupId) {
        if (!confirm('Are you sure you want to delete this backup from history?')) {
            return;
        }

        this.backupHistory = this.backupHistory.filter(backup => backup.id !== backupId);
        localStorage.setItem('backupHistory', JSON.stringify(this.backupHistory));
        
        this.loadBackupHistory();
        this.updateBackupStatus();
        
        ZovatuApp.showNotification('Backup deleted from history', 'success');
    }
}

// Global functions for modal management
function closeRestoreConfirmModal() {
    if (window.backupManager) {
        window.backupManager.closeRestoreConfirmModal();
    }
}

// Initialize backup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.backupManager = new BackupManager();
});

// Export for use in other modules
window.BackupManager = BackupManager;

