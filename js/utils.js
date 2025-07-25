// Utility Functions

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate unique ID
function generateId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}${random}`;
}

// Generate invoice number
function generateInvoiceNumber() {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const lastInvoiceNumber = invoices.length > 0 ? 
        Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber.replace('INV-', '')))) : 0;
    return `INV-${String(lastInvoiceNumber + 1).padStart(6, '0')}`;
}

// Generate product code
function generateProductCode() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const lastProductNumber = products.length > 0 ? 
        Math.max(...products.map(prod => parseInt(prod.code.replace('PRD-', '')))) : 0;
    return `PRD-${String(lastProductNumber + 1).padStart(4, '0')}`;
}

// Generate customer ID
function generateCustomerId() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const lastCustomerNumber = customers.length > 0 ? 
        Math.max(...customers.map(cust => parseInt(cust.id.replace('CUST-', '')))) : 0;
    return `CUST-${String(lastCustomerNumber + 1).padStart(4, '0')}`;
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Hide modal
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Confirm dialog
function confirmDialog(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Export data to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print content
function printContent(content, title = 'Print') {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
}

// Sidebar toggle functionality
function initializeSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (menuToggle && sidebar && mainContent) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
            mainContent.classList.toggle('expanded');
        });
    }
}

// Role-based navigation
function initializeNavigation() {
    const user = auth.getCurrentUser();
    if (!user) return;
    
    // Hide admin-only links for salesman
    if (user.role === 'salesman') {
        const adminOnlyLinks = ['purchaseLink', 'quotationLink', 'reportsLink', 'settingsLink'];
        adminOnlyLinks.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) {
                link.style.display = 'none';
            }
        });
    }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar
    initializeSidebar();
    
    // Initialize navigation based on role
    initializeNavigation();
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const visibleModals = document.querySelectorAll('.modal[style*="flex"]');
            visibleModals.forEach(modal => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
    });
});

// Data backup and restore
function createBackup() {
    const data = {
        products: JSON.parse(localStorage.getItem('products') || '[]'),
        customers: JSON.parse(localStorage.getItem('customers') || '[]'),
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
        purchases: JSON.parse(localStorage.getItem('purchases') || '[]'),
        quotations: JSON.parse(localStorage.getItem('quotations') || '[]'),
        settings: JSON.parse(localStorage.getItem('settings') || '{}'),
        users: JSON.parse(localStorage.getItem('billingUsers') || '{}'),
        backupDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `billing-backup-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Backup created successfully', 'success');
}

function restoreBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate backup data
            if (!data.backupDate) {
                throw new Error('Invalid backup file');
            }
            
            // Restore data
            if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
            if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
            if (data.invoices) localStorage.setItem('invoices', JSON.stringify(data.invoices));
            if (data.purchases) localStorage.setItem('purchases', JSON.stringify(data.purchases));
            if (data.quotations) localStorage.setItem('quotations', JSON.stringify(data.quotations));
            if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));
            if (data.users) localStorage.setItem('billingUsers', JSON.stringify(data.users));
            
            showNotification('Backup restored successfully. Page will reload.', 'success');
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            showNotification('Invalid backup file', 'error');
        }
    };
    reader.readAsText(file);
}

// Search functionality
function performSearch(searchTerm, data, searchFields) {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
        return searchFields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

// Pagination
function paginate(data, page = 1, itemsPerPage = 10) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
        data: data.slice(startIndex, endIndex),
        totalPages: Math.ceil(data.length / itemsPerPage),
        currentPage: page,
        totalItems: data.length
    };
}

// Local storage helpers
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        showNotification('Error saving data', 'error');
        return false;
    }
}

function getFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        showNotification('Error loading data', 'error');
        return defaultValue;
    }
}

// Validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function validateRequired(value) {
    return value && value.toString().trim().length > 0;
}

// Auto-save functionality
let autoSaveTimeout;
function autoSave(key, data, delay = 1000) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        saveToStorage(key, data);
    }, delay);
}

// Export utility functions
window.utils = {
    formatCurrency,
    formatDate,
    formatDateTime,
    generateId,
    generateInvoiceNumber,
    generateProductCode,
    generateCustomerId,
    showModal,
    hideModal,
    showNotification,
    confirmDialog,
    exportToCSV,
    printContent,
    createBackup,
    restoreBackup,
    performSearch,
    paginate,
    saveToStorage,
    getFromStorage,
    validateEmail,
    validatePhone,
    validateRequired,
    autoSave
};

