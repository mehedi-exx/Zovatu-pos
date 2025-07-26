// Zovatu Billing Tool - Settings JavaScript
// Handles system settings, business configuration, and user preferences

class SettingsManager {
    constructor() {
        this.defaultSettings = {
            business: {
                name: 'Zovatu Business',
                type: 'retail',
                phone: '',
                email: '',
                website: '',
                taxId: '',
                address: '',
                logo: ''
            },
            invoice: {
                prefix: 'INV',
                startNumber: 1,
                currency: 'USD',
                taxRate: 0,
                paymentTerms: 30,
                template: 'modern',
                footer: 'Thank you for your business!',
                termsConditions: ''
            },
            printing: {
                defaultSize: 'A4',
                orientation: 'portrait',
                autoPrint: false,
                copies: 1,
                receiptHeader: 'Welcome to our store!',
                receiptFooter: 'Thank you for shopping with us!'
            },
            notifications: {
                lowStockThreshold: 10,
                dueReminderDays: 3,
                enableLowStockAlerts: true,
                enableDuePaymentAlerts: true,
                enableDailySummary: false,
                enableSoundNotifications: false
            },
            system: {
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12',
                language: 'en',
                theme: 'light',
                enableAutoSave: true,
                enableAutoBackup: false,
                enableCompactMode: false,
                enableDeveloperMode: false,
                dataRetentionDays: 365
            }
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.setupTabs();
        this.populateFormFields();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('businessForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBusinessSettings();
        });

        document.getElementById('invoiceForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInvoiceSettings();
        });

        document.getElementById('printingForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePrintingSettings();
        });

        document.getElementById('notificationsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationSettings();
        });

        document.getElementById('systemForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemSettings();
        });

        // Reset settings button
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
            this.resetAllSettings();
        });

        // Auto-save on input change (if enabled)
        this.setupAutoSave();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.settings-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(`${targetTab}Tab`)?.classList.add('active');
            });
        });
    }

    setupAutoSave() {
        const autoSaveEnabled = this.settings.system.enableAutoSave;
        if (!autoSaveEnabled) return;

        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.debounce(() => this.autoSave(input), 1000);
            });
        });
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            this.settings = { ...this.defaultSettings, ...JSON.parse(savedSettings) };
        } else {
            this.settings = { ...this.defaultSettings };
        }
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
        localStorage.setItem('settings_lastModified', new Date().toISOString());
        
        // Apply settings immediately
        this.applySettings();
        
        ZovatuApp.showNotification('Settings saved successfully', 'success');
    }

    populateFormFields() {
        // Business Information
        this.setFieldValue('businessName', this.settings.business.name);
        this.setFieldValue('businessType', this.settings.business.type);
        this.setFieldValue('businessPhone', this.settings.business.phone);
        this.setFieldValue('businessEmail', this.settings.business.email);
        this.setFieldValue('businessWebsite', this.settings.business.website);
        this.setFieldValue('businessTaxId', this.settings.business.taxId);
        this.setFieldValue('businessAddress', this.settings.business.address);
        this.setFieldValue('businessLogo', this.settings.business.logo);

        // Invoice Settings
        this.setFieldValue('invoicePrefix', this.settings.invoice.prefix);
        this.setFieldValue('invoiceStartNumber', this.settings.invoice.startNumber);
        this.setFieldValue('defaultCurrency', this.settings.invoice.currency);
        this.setFieldValue('defaultTaxRate', this.settings.invoice.taxRate);
        this.setFieldValue('paymentTerms', this.settings.invoice.paymentTerms);
        this.setFieldValue('invoiceTemplate', this.settings.invoice.template);
        this.setFieldValue('invoiceFooter', this.settings.invoice.footer);
        this.setFieldValue('termsConditions', this.settings.invoice.termsConditions);

        // Printing Settings
        this.setFieldValue('defaultPrintSize', this.settings.printing.defaultSize);
        this.setFieldValue('printOrientation', this.settings.printing.orientation);
        this.setFieldValue('autoPrint', this.settings.printing.autoPrint);
        this.setFieldValue('printCopies', this.settings.printing.copies);
        this.setFieldValue('receiptHeader', this.settings.printing.receiptHeader);
        this.setFieldValue('receiptFooter', this.settings.printing.receiptFooter);

        // Notification Settings
        this.setFieldValue('lowStockThreshold', this.settings.notifications.lowStockThreshold);
        this.setFieldValue('dueReminderDays', this.settings.notifications.dueReminderDays);
        this.setCheckboxValue('enableLowStockAlerts', this.settings.notifications.enableLowStockAlerts);
        this.setCheckboxValue('enableDuePaymentAlerts', this.settings.notifications.enableDuePaymentAlerts);
        this.setCheckboxValue('enableDailySummary', this.settings.notifications.enableDailySummary);
        this.setCheckboxValue('enableSoundNotifications', this.settings.notifications.enableSoundNotifications);

        // System Settings
        this.setFieldValue('dateFormat', this.settings.system.dateFormat);
        this.setFieldValue('timeFormat', this.settings.system.timeFormat);
        this.setFieldValue('systemLanguage', this.settings.system.language);
        this.setFieldValue('systemTheme', this.settings.system.theme);
        this.setCheckboxValue('enableAutoSave', this.settings.system.enableAutoSave);
        this.setCheckboxValue('enableAutoBackup', this.settings.system.enableAutoBackup);
        this.setCheckboxValue('enableCompactMode', this.settings.system.enableCompactMode);
        this.setCheckboxValue('enableDeveloperMode', this.settings.system.enableDeveloperMode);
        this.setFieldValue('dataRetentionDays', this.settings.system.dataRetentionDays);
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    }

    setCheckboxValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.checked = value;
        }
    }

    getFieldValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.value : '';
    }

    getCheckboxValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.checked : false;
    }

    saveBusinessSettings() {
        this.settings.business = {
            name: this.getFieldValue('businessName'),
            type: this.getFieldValue('businessType'),
            phone: this.getFieldValue('businessPhone'),
            email: this.getFieldValue('businessEmail'),
            website: this.getFieldValue('businessWebsite'),
            taxId: this.getFieldValue('businessTaxId'),
            address: this.getFieldValue('businessAddress'),
            logo: this.getFieldValue('businessLogo')
        };
        
        this.saveSettings();
    }

    saveInvoiceSettings() {
        this.settings.invoice = {
            prefix: this.getFieldValue('invoicePrefix'),
            startNumber: parseInt(this.getFieldValue('invoiceStartNumber')),
            currency: this.getFieldValue('defaultCurrency'),
            taxRate: parseFloat(this.getFieldValue('defaultTaxRate')),
            paymentTerms: parseInt(this.getFieldValue('paymentTerms')),
            template: this.getFieldValue('invoiceTemplate'),
            footer: this.getFieldValue('invoiceFooter'),
            termsConditions: this.getFieldValue('termsConditions')
        };
        
        this.saveSettings();
    }

    savePrintingSettings() {
        this.settings.printing = {
            defaultSize: this.getFieldValue('defaultPrintSize'),
            orientation: this.getFieldValue('printOrientation'),
            autoPrint: this.getFieldValue('autoPrint') === 'true',
            copies: parseInt(this.getFieldValue('printCopies')),
            receiptHeader: this.getFieldValue('receiptHeader'),
            receiptFooter: this.getFieldValue('receiptFooter')
        };
        
        this.saveSettings();
    }

    saveNotificationSettings() {
        this.settings.notifications = {
            lowStockThreshold: parseInt(this.getFieldValue('lowStockThreshold')),
            dueReminderDays: parseInt(this.getFieldValue('dueReminderDays')),
            enableLowStockAlerts: this.getCheckboxValue('enableLowStockAlerts'),
            enableDuePaymentAlerts: this.getCheckboxValue('enableDuePaymentAlerts'),
            enableDailySummary: this.getCheckboxValue('enableDailySummary'),
            enableSoundNotifications: this.getCheckboxValue('enableSoundNotifications')
        };
        
        this.saveSettings();
    }

    saveSystemSettings() {
        this.settings.system = {
            dateFormat: this.getFieldValue('dateFormat'),
            timeFormat: this.getFieldValue('timeFormat'),
            language: this.getFieldValue('systemLanguage'),
            theme: this.getFieldValue('systemTheme'),
            enableAutoSave: this.getCheckboxValue('enableAutoSave'),
            enableAutoBackup: this.getCheckboxValue('enableAutoBackup'),
            enableCompactMode: this.getCheckboxValue('enableCompactMode'),
            enableDeveloperMode: this.getCheckboxValue('enableDeveloperMode'),
            dataRetentionDays: parseInt(this.getFieldValue('dataRetentionDays'))
        };
        
        this.saveSettings();
        
        // Restart auto-save if setting changed
        this.setupAutoSave();
    }

    applySettings() {
        // Apply theme
        this.applyTheme();
        
        // Apply compact mode
        this.applyCompactMode();
        
        // Apply language (if implemented)
        this.applyLanguage();
        
        // Update global settings for other modules
        window.ZovatuSettings = this.settings;
    }

    applyTheme() {
        const theme = this.settings.system.theme;
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        }
    }

    applyCompactMode() {
        const compactMode = this.settings.system.enableCompactMode;
        const body = document.body;
        
        if (compactMode) {
            body.classList.add('compact-mode');
        } else {
            body.classList.remove('compact-mode');
        }
    }

    applyLanguage() {
        // Language implementation would go here
        // For now, just store the preference
        document.documentElement.lang = this.settings.system.language;
    }

    autoSave(input) {
        // Determine which form the input belongs to and save accordingly
        const form = input.closest('form');
        if (!form) return;

        switch (form.id) {
            case 'businessForm':
                this.saveBusinessSettings();
                break;
            case 'invoiceForm':
                this.saveInvoiceSettings();
                break;
            case 'printingForm':
                this.savePrintingSettings();
                break;
            case 'notificationsForm':
                this.saveNotificationSettings();
                break;
            case 'systemForm':
                this.saveSystemSettings();
                break;
        }
    }

    resetAllSettings() {
        if (!confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
            return;
        }

        const confirmText = prompt('Type "RESET" to confirm:');
        if (confirmText !== 'RESET') {
            ZovatuApp.showNotification('Settings reset cancelled', 'info');
            return;
        }

        // Reset to default settings
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        this.populateFormFields();
        
        ZovatuApp.showNotification('All settings have been reset to default values', 'success');
    }

    exportSettings() {
        const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zovatu-settings-${ZovatuApp.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        ZovatuApp.showNotification('Settings exported successfully', 'success');
    }

    importSettings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target.result);
                
                // Validate settings structure
                if (this.validateSettings(importedSettings)) {
                    this.settings = { ...this.defaultSettings, ...importedSettings };
                    this.saveSettings();
                    this.populateFormFields();
                    ZovatuApp.showNotification('Settings imported successfully', 'success');
                } else {
                    ZovatuApp.showNotification('Invalid settings file format', 'error');
                }
            } catch (error) {
                ZovatuApp.showNotification('Failed to import settings: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    validateSettings(settings) {
        // Basic validation to ensure the settings object has the expected structure
        const requiredSections = ['business', 'invoice', 'printing', 'notifications', 'system'];
        return requiredSections.every(section => settings.hasOwnProperty(section));
    }

    // Get specific setting value
    getSetting(section, key) {
        return this.settings[section] && this.settings[section][key] !== undefined 
            ? this.settings[section][key] 
            : this.defaultSettings[section][key];
    }

    // Set specific setting value
    setSetting(section, key, value) {
        if (!this.settings[section]) {
            this.settings[section] = {};
        }
        this.settings[section][key] = value;
        this.saveSettings();
    }

    // Utility function for debouncing
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

    // Get formatted currency symbol
    getCurrencySymbol() {
        const currency = this.getSetting('invoice', 'currency');
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'BDT': '৳',
            'INR': '₹'
        };
        return symbols[currency] || '$';
    }

    // Get formatted date according to user preference
    formatDate(date, includeTime = false) {
        const format = this.getSetting('system', 'dateFormat');
        const timeFormat = this.getSetting('system', 'timeFormat');
        
        return ZovatuApp.formatDate(date, format, includeTime ? timeFormat : null);
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
    
    // Make settings globally available
    window.ZovatuSettings = window.settingsManager.settings;
});

// Export for use in other modules
window.SettingsManager = SettingsManager;

