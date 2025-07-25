// Settings Management

let settings = {};
let users = {};

// Initialize settings page
document.addEventListener('DOMContentLoaded', function() {
    if (!auth.protectPage('admin')) return;
    
    loadSettings();
    loadUsers();
    setupEventListeners();
    addSettingsStyles();
});

// Add settings-specific styles
function addSettingsStyles() {
    if (document.getElementById('settingsStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'settingsStyles';
    styles.textContent = `
        .settings-tabs {
            display: flex;
            border-bottom: 2px solid #eee;
            margin-bottom: 20px;
        }
        .tab-button {
            background: none;
            border: none;
            padding: 15px 20px;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            font-weight: bold;
            color: #666;
        }
        .tab-button:hover {
            background-color: #f8f9fa;
            color: #007bff;
        }
        .tab-button.active {
            color: #007bff;
            border-bottom-color: #007bff;
            background-color: #f8f9fa;
        }
        .settings-tab {
            display: none;
        }
        .settings-tab.active {
            display: block;
        }
    `;
    document.head.appendChild(styles);
}

// Setup event listeners
function setupEventListeners() {
    // Shop form submission
    document.getElementById('shopForm').addEventListener('submit', handleShopFormSubmit);
    
    // Password form submission
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordFormSubmit);
    
    // General form submission
    document.getElementById('generalForm').addEventListener('submit', handleGeneralFormSubmit);
    
    // Add user form submission
    document.getElementById('addUserForm').addEventListener('submit', handleAddUserFormSubmit);
}

// Load settings from storage
function loadSettings() {
    settings = utils.getFromStorage('settings', {
        shopName: '',
        shopPhone: '',
        shopEmail: '',
        shopWebsite: '',
        shopAddress: '',
        shopCity: '',
        shopState: '',
        shopZip: '',
        shopDescription: '',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        defaultTax: 0,
        lowStockThreshold: 10,
        enableNotifications: true,
        enableAutoBackup: true
    });
    
    populateShopForm();
    populateGeneralForm();
    updateLastBackupTime();
}

// Load users from storage
function loadUsers() {
    users = utils.getFromStorage('billingUsers', {});
    displayUsers();
}

// Populate shop form
function populateShopForm() {
    document.getElementById('shopName').value = settings.shopName || '';
    document.getElementById('shopPhone').value = settings.shopPhone || '';
    document.getElementById('shopEmail').value = settings.shopEmail || '';
    document.getElementById('shopWebsite').value = settings.shopWebsite || '';
    document.getElementById('shopAddress').value = settings.shopAddress || '';
    document.getElementById('shopCity').value = settings.shopCity || '';
    document.getElementById('shopState').value = settings.shopState || '';
    document.getElementById('shopZip').value = settings.shopZip || '';
    document.getElementById('shopDescription').value = settings.shopDescription || '';
}

// Populate general form
function populateGeneralForm() {
    document.getElementById('currency').value = settings.currency || 'USD';
    document.getElementById('dateFormat').value = settings.dateFormat || 'MM/DD/YYYY';
    document.getElementById('defaultTax').value = settings.defaultTax || 0;
    document.getElementById('lowStockThreshold').value = settings.lowStockThreshold || 10;
    document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;
    document.getElementById('enableAutoBackup').checked = settings.enableAutoBackup !== false;
}

// Display users
function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    const userList = Object.values(users);
    
    if (userList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = userList.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>
                <span class="type-badge type-${user.role}">
                    ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
            </td>
            <td>${user.createdAt ? utils.formatDate(user.createdAt) : 'N/A'}</td>
            <td class="actions">
                ${user.username !== 'admin' ? `
                    <button onclick="deleteUser('${user.username}')" class="btn-danger" style="padding: 5px 10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span style="color: #666;">Default Admin</span>'}
            </td>
        </tr>
    `).join('');
}

// Show tab
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Handle shop form submission
function handleShopFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        shopName: document.getElementById('shopName').value,
        shopPhone: document.getElementById('shopPhone').value,
        shopEmail: document.getElementById('shopEmail').value,
        shopWebsite: document.getElementById('shopWebsite').value,
        shopAddress: document.getElementById('shopAddress').value,
        shopCity: document.getElementById('shopCity').value,
        shopState: document.getElementById('shopState').value,
        shopZip: document.getElementById('shopZip').value,
        shopDescription: document.getElementById('shopDescription').value
    };
    
    // Validation
    if (!formData.shopName) {
        utils.showNotification('Shop name is required', 'error');
        return;
    }
    
    if (formData.shopEmail && !utils.validateEmail(formData.shopEmail)) {
        utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Update settings
    settings = { ...settings, ...formData };
    utils.saveToStorage('settings', settings);
    
    utils.showNotification('Shop information saved successfully', 'success');
}

// Handle password form submission
function handlePasswordFormSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (newPassword !== confirmPassword) {
        utils.showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        utils.showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Change password
    if (auth.changePassword(currentPassword, newPassword)) {
        document.getElementById('passwordForm').reset();
        utils.showNotification('Password changed successfully', 'success');
    }
}

// Handle general form submission
function handleGeneralFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        currency: document.getElementById('currency').value,
        dateFormat: document.getElementById('dateFormat').value,
        defaultTax: parseFloat(document.getElementById('defaultTax').value) || 0,
        lowStockThreshold: parseInt(document.getElementById('lowStockThreshold').value) || 10,
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableAutoBackup: document.getElementById('enableAutoBackup').checked
    };
    
    // Update settings
    settings = { ...settings, ...formData };
    utils.saveToStorage('settings', settings);
    
    utils.showNotification('General settings saved successfully', 'success');
}

// Show add user modal
function showAddUserModal() {
    document.getElementById('addUserForm').reset();
    utils.showModal('addUserModal');
}

// Hide add user modal
function hideAddUserModal() {
    utils.hideModal('addUserModal');
}

// Handle add user form submission
function handleAddUserFormSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    // Validation
    if (username.length < 3) {
        utils.showNotification('Username must be at least 3 characters long', 'error');
        return;
    }
    
    if (password.length < 6) {
        utils.showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Add user
    if (auth.addUser(username, password, role)) {
        hideAddUserModal();
        loadUsers();
        utils.showNotification('User added successfully', 'success');
    }
}

// Delete user
function deleteUser(username) {
    if (username === 'admin') {
        utils.showNotification('Cannot delete default admin user', 'error');
        return;
    }
    
    utils.confirmDialog(`Are you sure you want to delete user "${username}"?`, () => {
        const users = utils.getFromStorage('billingUsers', {});
        
        // Find and remove user
        for (let userId in users) {
            if (users[userId].username === username) {
                delete users[userId];
                break;
            }
        }
        
        utils.saveToStorage('billingUsers', users);
        loadUsers();
        utils.showNotification('User deleted successfully', 'success');
    });
}

// Handle backup restore
function handleBackupRestore(input) {
    const file = input.files[0];
    if (!file) return;
    
    utils.confirmDialog('This will replace all current data. Are you sure?', () => {
        utils.restoreBackup(file);
    });
    
    // Clear the input
    input.value = '';
}

// Update last backup time
function updateLastBackupTime() {
    const lastBackup = localStorage.getItem('lastBackupTime');
    const lastBackupElement = document.getElementById('lastBackupTime');
    
    if (lastBackup && lastBackupElement) {
        lastBackupElement.textContent = utils.formatDateTime(lastBackup);
    }
}

// Auto backup function (called daily)
function performAutoBackup() {
    if (settings.enableAutoBackup !== false) {
        const data = {
            products: utils.getFromStorage('products', []),
            customers: utils.getFromStorage('customers', []),
            invoices: utils.getFromStorage('invoices', []),
            purchases: utils.getFromStorage('purchases', []),
            quotations: utils.getFromStorage('quotations', []),
            settings: utils.getFromStorage('settings', {}),
            users: utils.getFromStorage('billingUsers', {}),
            backupDate: new Date().toISOString(),
            autoBackup: true
        };
        
        // Store backup in localStorage with a special key
        localStorage.setItem('autoBackup', JSON.stringify(data));
        localStorage.setItem('lastBackupTime', new Date().toISOString());
        
        console.log('Auto backup completed');
    }
}

// Schedule auto backup (runs once per day)
function scheduleAutoBackup() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        performAutoBackup();
        // Schedule next backup
        setInterval(performAutoBackup, 24 * 60 * 60 * 1000); // Every 24 hours
    }, msUntilTomorrow);
}

// Initialize auto backup scheduling
scheduleAutoBackup();

// Export settings functions
window.settingsModule = {
    getSettings: () => settings,
    getSetting: (key, defaultValue = null) => settings[key] || defaultValue,
    updateSetting: (key, value) => {
        settings[key] = value;
        utils.saveToStorage('settings', settings);
    }
};

