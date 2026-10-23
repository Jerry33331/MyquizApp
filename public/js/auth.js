/**
 * Authentication and User State Management
 * Phase 1: Foundation and Authentication
 */

let currentUser = null;

// DOM Elements
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');
const usernameSpan = document.querySelector('.username');
const roleBadgeSpan = document.querySelector('.role-badge');

// Page sections
const landingSection = document.getElementById('landing-section');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const homeSection = document.getElementById('home-section');

/**
 * Initialize auth state on page load
 */
async function initializeAuth() {
    try {
        const response = await window.api.authAPI.getMe();
        if (response.success && response.data) {
            setUser(response.data.user);
        } else {
            clearUser();
        }
    } catch {
        clearUser();
    }
}

/**
 * Set user and update UI
 */
function setUser(user) {
    currentUser = user;
    updateAuthUI();
}

/**
 * Clear user and update UI
 */
function clearUser() {
    currentUser = null;
    updateAuthUI();
}

/**
 * Update UI based on auth state
 */
function updateAuthUI() {
    const isLoggedIn = currentUser !== null;
    
    // Update nav
    if (authButtons) authButtons.style.display = isLoggedIn ? 'none' : 'flex';
    if (userInfo) {
        userInfo.style.display = isLoggedIn ? 'flex' : 'none';
        if (usernameSpan) usernameSpan.textContent = currentUser.username;
        if (roleBadgeSpan) {
            roleBadgeSpan.textContent = currentUser.role;
            roleBadgeSpan.className = `role-badge ${currentUser.role}`;
        }
    }
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    
    // Update page sections
    if (landingSection) landingSection.style.display = isLoggedIn ? 'none' : 'block';
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    if (homeSection) homeSection.style.display = isLoggedIn ? 'block' : 'none';
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await window.api.authAPI.login(email, password);
        if (response.success) {
            setUser(response.data.user);
            showAlert('Login successful!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Login failed', 'error');
    }
}

/**
 * Handle register form submission
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // Validate
    if (password !== confirm) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await window.api.authAPI.register(username, email, password);
        if (response.success) {
            setUser(response.data.user);
            showAlert('Registration successful! Welcome!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Registration failed', 'error');
    }
}

/**
 * Logout
 */
async function logout() {
    try {
        await window.api.authAPI.logout();
        clearUser();
        showAlert('Logged out successfully', 'success');
    } catch (error) {
        showAlert(error.message || 'Logout failed', 'error');
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const existing = document.querySelector('.alert');
    if (existing) existing.remove();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    const main = document.getElementById('main-content');
    if (main) main.insertBefore(alert, main.firstChild);
    
    if (type !== 'error') {
        setTimeout(() => alert.remove(), 5000);
    }
}

// Initialize on DOM ready
// Note: Don't handle navigation here - let app.js do it after auth is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

// Export for global access
if (typeof window !== 'undefined') {
    window.auth = {
        handleLogin,
        handleRegister,
        logout,
        setUser,
        clearUser,
        showAlert,
        get currentUser() { return currentUser; },
    };
}
