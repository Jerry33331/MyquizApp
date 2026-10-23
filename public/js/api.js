/**
 * API Client for MyQuizApp
 * Phase 2: Quiz Engine
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

const quizAPI = {
    getAll: () => apiRequest('GET', '/quizzes'),
    getAllAdmin: () => apiRequest('GET', '/quizzes/all'),
    getById: (quizId) => apiRequest('GET', `/quizzes/${quizId}`),
    getByCategory: (category) => apiRequest('GET', `/quizzes/category/${category}`),
    create: (quizData) => apiRequest('POST', '/quizzes', quizData),
    update: (quizId, quizData) => apiRequest('PUT', `/quizzes/${quizId}`, quizData),
    delete: (quizId) => apiRequest('DELETE', `/quizzes/${quizId}`),
};

const questionAPI = {
    getByQuiz: (quizId) => apiRequest('GET', `/questions/quiz/${quizId}`),
    create: (questionData) => apiRequest('POST', '/questions', questionData),
    update: (questionId, questionData) => apiRequest('PUT', `/questions/${questionId}`, questionData),
    delete: (questionId) => apiRequest('DELETE', `/questions/${questionId}`),
};

const attemptAPI = {
    submit: (attemptData) => apiRequest('POST', '/attempts', attemptData),
    getMyHistory: () => apiRequest('GET', '/attempts/me'),
    getByQuiz: (quizId) => apiRequest('GET', `/attempts/quiz/${quizId}`),
    getByUser: (userId) => apiRequest('GET', `/attempts/user/${userId}`),
};

const leaderboardAPI = {
    getOverall: () => apiRequest('GET', '/leaderboard'),
    getByQuiz: (quizId) => apiRequest('GET', `/leaderboard/quiz/${quizId}`),
};

// Export for global access
if (typeof window !== 'undefined') {
    window.api = { authAPI, quizAPI, questionAPI, attemptAPI, leaderboardAPI };
}
