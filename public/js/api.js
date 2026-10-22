/**
 * API Client for MyQuizApp
 * Phase 1: Foundation and Authentication
 */

const API_BASE = '/api';

async function apiRequest(method, endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}

const authAPI = {
    register: (username, email, password) => 
        apiRequest('POST', '/auth/register', { username, email, password }),
    
    login: (email, password) => 
        apiRequest('POST', '/auth/login', { email, password }),
    
    logout: () => apiRequest('POST', '/auth/logout'),
    
    getMe: () => apiRequest('GET', '/auth/me'),
};

// For future phases
const quizAPI = {};
const attemptAPI = {};
const leaderboardAPI = {};

if (typeof window !== 'undefined') {
    window.api = { authAPI, quizAPI, attemptAPI, leaderboardAPI };
}
