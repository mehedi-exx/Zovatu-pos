// Authentication and User Management

// Default users (in a real app, these would be hashed and stored securely)
const defaultUsers = {
    admin: {
        username: 'admin',
        password: 'admin123', // In production, this should be hashed
        role: 'admin'
    },
    salesman: {
        username: 'salesman',
        password: 'sales123', // In production, this should be hashed
        role: 'salesman'
    }
};

// Initialize default users if not exists
function initializeUsers() {
    const users = localStorage.getItem('billingUsers');
    if (!users) {
        localStorage.setItem('billingUsers', JSON.stringify(defaultUsers));
    }
}

// Login function
function login(username, password, role) {
    const users = JSON.parse(localStorage.getItem('billingUsers') || '{}');
    
    // Check if user exists and credentials match
    const user = Object.values(users).find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role
    );
    
    if (user) {
        // Store current session
        const session = {
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentSession', JSON.stringify(session));
        return true;
    }
    
    return false;
}

// Check if user is logged in
function isLoggedIn() {
    const session = localStorage.getItem('currentSession');
    return session !== null;
}

// Get current user
function getCurrentUser() {
    const session = localStorage.getItem('currentSession');
    return session ? JSON.parse(session) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('currentSession');
    window.location.href = 'index.html';
}

// Check user role
function hasRole(requiredRole) {
    const user = getCurrentUser();
    if (!user) return false;
    
    if (requiredRole === 'admin') {
        return user.role === 'admin';
    } else if (requiredRole === 'salesman') {
        return user.role === 'salesman' || user.role === 'admin'; // Admin can access salesman features
    }
    
    return false;
}

// Redirect based on role
function redirectToDashboard() {
    const user = getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html';
    }
}

// Protect page (call this on each protected page)
function protectPage(requiredRole = null) {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    
    if (requiredRole && !hasRole(requiredRole)) {
        alert('Access denied. You do not have permission to access this page.');
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize users
    initializeUsers();
    
    // If on login page
    if (document.getElementById('loginForm')) {
        // Check if already logged in
        // if (isLoggedIn()) {
        //     redirectToDashboard();
        //     return;
        // }
        
        // Handle login form submission
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const messageDiv = document.getElementById('message');
            
            if (login(username, password, role)) {
                messageDiv.innerHTML = '<div class="message success">Login successful! Redirecting...</div>';
                setTimeout(() => {
                    redirectToDashboard();
                }, 1000);
            } else {
                messageDiv.innerHTML = '<div class="message error">Invalid credentials or role mismatch.</div>';
            }
        });
    }
    
    // If on any other page, protect it
    if (!document.getElementById('loginForm')) {
        protectPage();
        
        // Setup logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // Display current user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            const user = getCurrentUser();
            userInfo.textContent = `${user.username} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;
        }
    }
});

// Add user function (for admin)
function addUser(username, password, role) {
    if (!hasRole('admin')) {
        alert('Only admin can add users.');
        return false;
    }
    
    const users = JSON.parse(localStorage.getItem('billingUsers') || '{}');
    
    // Check if username already exists
    if (Object.values(users).some(u => u.username === username)) {
        alert('Username already exists.');
        return false;
    }
    
    // Add new user
    const userId = Date.now().toString();
    users[userId] = {
        username: username,
        password: password, // In production, this should be hashed
        role: role
    };
    
    localStorage.setItem('billingUsers', JSON.stringify(users));
    return true;
}

// Change password function
function changePassword(currentPassword, newPassword) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const users = JSON.parse(localStorage.getItem('billingUsers') || '{}');
    const userRecord = Object.values(users).find(u => u.username === user.username);
    
    if (!userRecord || userRecord.password !== currentPassword) {
        alert('Current password is incorrect.');
        return false;
    }
    
    // Update password
    userRecord.password = newPassword;
    
    // Find and update the user in the users object
    for (let userId in users) {
        if (users[userId].username === user.username) {
            users[userId] = userRecord;
            break;
        }
    }
    
    localStorage.setItem('billingUsers', JSON.stringify(users));
    alert('Password changed successfully.');
    return true;
}

// Export functions for use in other scripts
window.auth = {
    login,
    logout,
    isLoggedIn,
    getCurrentUser,
    hasRole,
    protectPage,
    addUser,
    changePassword
};

