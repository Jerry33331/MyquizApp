/**
 * Main Application Logic
 * Phase 2: Quiz Engine
 */

// Navigation helper
function navigateTo(path) {
    window.history.pushState({}, '', path);
    // Re-check auth state before navigating
    if (window.auth && window.auth.currentUser) {
        handleNavigation();
    } else {
        // If auth check fails, go to landing
        handleNavigation();
    }
}

// Handle browser navigation
function handleNavigation() {
    const path = window.location.pathname;
    
    // Hide all sections
    const sections = document.querySelectorAll('main > section');
    sections.forEach(s => s.style.display = 'none');
    
    // Route based on auth state and path
    if (window.auth && window.auth.currentUser) {
        // Logged in user
        if (path === '/' || path === '') {
            document.getElementById('home-section').style.display = 'block';
            if (typeof loadQuizzes === 'function') loadQuizzes();
        } else if (path === '/quizzes') {
            document.getElementById('quizzes-section').style.display = 'block';
            if (typeof loadQuizzes === 'function') loadQuizzes();
        } else if (path === '/history') {
            document.getElementById('history-section').style.display = 'block';
            if (typeof loadHistory === 'function') loadHistory();
        } else if (path === '/leaderboard') {
            document.getElementById('leaderboard-section').style.display = 'block';
            if (typeof loadLeaderboard === 'function') loadLeaderboard();
        } else if (path.startsWith('/quiz/')) {
            const quizId = path.split('/')[2];
            if (typeof viewQuizDetails === 'function') viewQuizDetails(quizId);
        } else if (path === '/admin') {
            document.getElementById('admin-section').style.display = 'block';
        }
    } else {
        // Not logged in
        if (path === '/' || path === '') {
            document.getElementById('landing-section').style.display = 'block';
        } else if (path === '/login') {
            document.getElementById('login-section').style.display = 'block';
        } else if (path === '/register') {
            document.getElementById('register-section').style.display = 'block';
        } else {
            // Redirect to landing for protected routes
            navigateTo('/');
        }
    }
    
    // Update auth UI
    if (window.auth) {
        window.auth.updateAuthUI();
    }
}

// Start quiz from quiz details
function startQuiz() {
    if (typeof startQuizFromDetails === 'function') {
        startQuizFromDetails();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth FIRST and wait for it to complete
    if (window.auth && typeof window.auth.initializeAuth === 'function') {
        await window.auth.initializeAuth();
    }
    
    // THEN handle navigation (now auth state is ready)
    handleNavigation();
    
    // Also set up click handlers for nav links to prevent page reload
    setupNavigationHandlers();
});

// Prevent default link behavior for SPA navigation
function setupNavigationHandlers() {
    const navLinks = document.querySelectorAll('.nav-link[href]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Only prevent default for internal app routes
            if (href && href.startsWith('/') && !href.includes('logout')) {
                e.preventDefault();
                navigateTo(href);
            }
        });
    });
    
    // Fix for logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn && typeof window.auth !== 'undefined' && window.auth.logout) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            window.auth.logout();
            navigateTo('/');
        };
    }
}

// Handle popstate (back/forward buttons)
window.addEventListener('popstate', () => {
    // Re-check auth state before handling navigation
    if (window.auth && window.auth.currentUser) {
        handleNavigation();
    } else {
        // If not logged in, go to landing
        navigateTo('/');
    }
});
