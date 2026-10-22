/**
 * Main Application Logic
 * Phase 1: Foundation and Authentication
 */

// Initialize API client
if (typeof window !== 'undefined') {
    window.api = window.api || {};
}

// Navigation helper
function navigateTo(path) {
    window.history.pushState({}, '', path);
    handleNavigation();
}

// Handle browser navigation
function handleNavigation() {
    const path = window.location.pathname;
    
    // Hide all sections
    const sections = document.querySelectorAll('main > section');
    sections.forEach(s => s.style.display = 'none');
    
    // Show correct section
    if (path === '/' || path === '') {
        if (window.auth.currentUser) {
            document.getElementById('home-section').style.display = 'block';
        } else {
            document.getElementById('landing-section').style.display = 'block';
        }
    } else if (path === '/login') {
        document.getElementById('login-section').style.display = 'block';
    } else if (path === '/register') {
        document.getElementById('register-section').style.display = 'block';
    }
    
    // Update auth UI
    if (window.auth) {
        window.auth.clearUser();
        window.auth.initializeAuth();
    }
}

// Handle popstate (back/forward buttons)
window.addEventListener('popstate', handleNavigation);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    handleNavigation();
});
