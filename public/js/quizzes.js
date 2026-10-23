/**
 * Quiz Management and Taking Logic
 * Phase 2: Quiz Engine
 */

// State
let currentQuiz = null;
let currentQuestions = [];
let currentAnswers = [];
let currentQuestionIndex = 0;
let quizStartTime = null;
let timerInterval = null;

/**
 * Load and display quizzes
 */
async function loadQuizzes() {
    try {
        const response = await window.api.quizAPI.getAll();
        if (response.success) {
            displayQuizzes(response.data.quizzes);
        }
    } catch (error) {
        showAlert(error.message || 'Failed to load quizzes', 'error');
    }
}

/**
 * Display quiz cards
 */
function displayQuizzes(quizzes) {
    const grid = document.getElementById('quizzes-grid') || document.getElementById('all-quizzes-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (quizzes.length === 0) {
        grid.innerHTML = '<p class="empty-state">No quizzes available yet.</p>';
        return;
    }
    
    quizzes.forEach(quiz => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.style.cursor = 'pointer';
        
        const categoryClass = `category-${quiz.category.toLowerCase()}`;
        const difficultyClass = `difficulty-${quiz.difficulty.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="quiz-card-header">
                <h3 class="quiz-card-title">${escapeHtml(quiz.title)}</h3>
                <div class="quiz-card-badges">
                    <span class="category-badge ${categoryClass}">${escapeHtml(quiz.category)}</span>
                    <span class="difficulty-badge ${difficultyClass}">${escapeHtml(quiz.difficulty)}</span>
                </div>
            </div>
            <p class="quiz-card-description">${escapeHtml(quiz.description || '')}</p>
            <div class="quiz-card-meta">
                <span class="quiz-card-questions">${quiz.question_count || 0} questions</span>
            </div>
            <div class="quiz-card-actions">
                <button class="btn btn-primary btn-sm">Start Quiz</button>
            </div>
        `;
        
        card.onclick = () => { viewQuizDetails(quiz.id); navigateTo("/quiz/" + quiz.id); };
        grid.appendChild(card);
    });
}

/**
 * View quiz details
 */
async function viewQuizDetails(quizId) {
    try {
        const response = await window.api.quizAPI.getById(quizId);
        if (response.success) {
            currentQuiz = response.data.quiz;
            currentQuestions = response.data.questions;
            displayQuizDetails();
        }
    } catch (error) {
        showAlert(error.message || 'Failed to load quiz', 'error');
    }
}

/**
 * Display quiz details page
 */
function displayQuizDetails() {
    if (!currentQuiz) return;
    
    const titleEl = document.getElementById('quiz-detail-title');
    const descEl = document.getElementById('quiz-detail-description');
    const categoryEl = document.getElementById('quiz-detail-category');
    const difficultyEl = document.getElementById('quiz-detail-difficulty');
    const questionsEl = document.getElementById('quiz-detail-questions');
    
    if (titleEl) titleEl.textContent = currentQuiz.title;
    if (descEl) descEl.textContent = currentQuiz.description || 'No description';
    if (categoryEl) {
        categoryEl.textContent = currentQuiz.category;
        categoryEl.className = `category-badge category-${currentQuiz.category.toLowerCase()}`;
    }
    if (difficultyEl) {
        difficultyEl.textContent = currentQuiz.difficulty;
        difficultyEl.className = `difficulty-badge difficulty-${currentQuiz.difficulty.toLowerCase()}`;
    }
    if (questionsEl) questionsEl.textContent = `${currentQuestions.length} questions`;
    
    // Show section
    hideAllSections();
    const detailSection = document.getElementById('quiz-detail-section');
    if (detailSection) detailSection.style.display = 'block';
}

/**
 * Start a quiz
 */
function startQuiz() {
    if (!currentQuiz || !currentQuestions || currentQuestions.length === 0) {
        showAlert('This quiz has no questions', 'error');
        return;
    }
    
    // Reset state
    currentAnswers = new Array(currentQuestions.length).fill(null);
    currentQuestionIndex = 0;
    quizStartTime = Date.now();
    
    // Start timer if quiz has time limit
    if (currentQuiz.time_limit && currentQuiz.time_limit > 0) {
        startTimer(currentQuiz.time_limit);
    }
    
    displayQuestion();
    
    // Show quiz section
    hideAllSections();
    document.getElementById('quiz-section').style.display = 'block';
    
    // Update navigation buttons
    document.getElementById('prev-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-flex';
    document.getElementById('submit-btn').style.display = 'none';
}

/**
 * Display current question
 */
function displayQuestion() {
    if (!currentQuestions || currentQuestionIndex >= currentQuestions.length) return;
    
    const question = currentQuestions[currentQuestionIndex];
    const questionEl = document.getElementById('quiz-question');
    const choicesEl = document.getElementById('quiz-choices');
    const progressEl = document.getElementById('quiz-progress-text');
    const progressBarEl = document.getElementById('quiz-progress-bar');
    
    // Update question text
    if (questionEl) questionEl.textContent = question.question_text;
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    if (progressEl) progressEl.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    if (progressBarEl) progressBarEl.style.width = `${progress}%`;
    
    // Display choices
    if (choicesEl) {
        choicesEl.innerHTML = '';
        
        question.choices.forEach((choice, index) => {
            const choiceEl = document.createElement('div');
            choiceEl.className = 'answer-choice';
            choiceEl.onclick = () => selectAnswer(index);
            
            // Check if this is the selected answer
            if (currentAnswers[currentQuestionIndex] === index) {
                choiceEl.classList.add('selected');
            }
            
            choiceEl.innerHTML = `
                <span class="answer-choice-letter">${String.fromCharCode(65 + index)}</span>
                <span>${escapeHtml(choice)}</span>
            `;
            
            choicesEl.appendChild(choiceEl);
        });
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (prevBtn) prevBtn.style.display = currentQuestionIndex > 0 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = currentQuestionIndex === currentQuestions.length - 1 ? 'inline-flex' : 'none';
}

/**
 * Select an answer
 */
function selectAnswer(index) {
    if (currentQuestionIndex >= currentAnswers.length) return;
    
    currentAnswers[currentQuestionIndex] = index;
    displayQuestion();
}

/**
 * Go to previous question
 */
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

/**
 * Go to next question
 */
function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

/**
 * Submit quiz
 */
async function submitQuiz() {
    // Check if all questions are answered
    if (currentAnswers.some(a => a === null)) {
        if (!confirm('You have unanswered questions. Are you sure you want to submit?')) {
            return;
        }
    }
    
    // Stop timer
    stopTimer();
    
    // Calculate time taken
    const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : null;
    
    try {
        const response = await window.api.attemptAPI.submit({
            quiz_id: currentQuiz.id,
            answers: currentAnswers,
            time_taken: timeTaken
        });
        
        if (response.success) {
            displayResults(response.data);
        }
    } catch (error) {
        showAlert(error.message || 'Failed to submit quiz', 'error');
    }
}

/**
 * Display results
 */
function displayResults(data) {
    const scoreEl = document.getElementById('results-score');
    const percentageEl = document.getElementById('results-percentage');
    const correctEl = document.getElementById('results-correct');
    const incorrectEl = document.getElementById('results-incorrect');
    const timeEl = document.getElementById('results-time');
    const messageEl = document.getElementById('results-message');
    
    const score = data.score;
    const total = data.total_questions;
    const percentage = data.percentage;
    const correct = data.correct_count || score; // Use correct_count if available
    const incorrect = data.incorrect_count || (total - correct);
    
    if (scoreEl) scoreEl.textContent = `${score}/${total}`;
    if (percentageEl) {
        percentageEl.textContent = `${percentage}%`;
        percentageEl.className = `results-percentage ${getPercentageClass(percentage)}`;
    }
    if (correctEl) correctEl.textContent = correct;
    if (incorrectEl) incorrectEl.textContent = incorrect;
    if (timeEl) timeEl.textContent = data.time_taken ? `${data.time_taken} seconds` : 'N/A';
    if (messageEl) messageEl.textContent = getResultMessage(percentage);
    
    // Show results section
    hideAllSections();
    document.getElementById('results-section').style.display = 'block';
}

/**
 * Retry the same quiz
 */
function retryQuiz() {
    if (currentQuiz) {
        viewQuizDetails(currentQuiz.id);
    }
}

/**
 * Load user's quiz history
 */
async function loadHistory() {
    try {
        const response = await window.api.attemptAPI.getMyHistory();
        if (response.success) {
            displayHistory(response.data.attempts);
        }
    } catch (error) {
        showAlert(error.message || 'Failed to load history', 'error');
    }
}

/**
 * Display history
 */
function displayHistory(attempts) {
    const tbody = document.getElementById('history-body');
    const emptyEl = document.getElementById('history-empty');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (attempts.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    
    attempts.forEach(attempt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(attempt.quiz_title || 'Unknown Quiz')}</td>
            <td>${attempt.score}/${attempt.total_questions}</td>
            <td>${attempt.percentage}%</td>
            <td>${formatDate(attempt.completed_at)}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Load leaderboard
 */
async function loadLeaderboard() {
    try {
        const response = await window.api.leaderboardAPI.getOverall();
        if (response.success) {
            displayLeaderboard(response.data.leaderboard || []);
        }
    } catch (error) {
        showAlert(error.message || 'Failed to load leaderboard', 'error');
    }
}

/**
 * Display leaderboard
 */
function displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (leaderboard.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No data yet</td></tr>';
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        const rankClass = index < 3 ? `leaderboard-rank ${getMedalClass(index)}` : 'leaderboard-rank';
        
        row.innerHTML = `
            <td class="${rankClass}">${entry.rank}</td>
            <td class="leaderboard-username">${escapeHtml(entry.username)}</td>
            <td class="leaderboard-attempts">${entry.total_completed_attempts || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Start timer for timed quizzes
 */
function startTimer(seconds) {
    let timeLeft = seconds;
    const timerEl = document.getElementById('timer-display');
    const timerContainer = document.getElementById('quiz-timer');
    
    if (timerEl) timerEl.textContent = formatTime(seconds);
    if (timerContainer) timerContainer.style.display = 'block';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = formatTime(timeLeft);
        
        // Update timer color
        if (timerEl) {
            timerEl.className = 'timer';
            if (timeLeft <= 30) timerEl.classList.add('warning');
            if (timeLeft <= 10) timerEl.classList.add('danger');
        }
        
        if (timeLeft <= 0) {
            stopTimer();
            submitQuiz();
        }
    }, 1000);
}

/**
 * Stop timer
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Helper functions
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getPercentageClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
}

function getResultMessage(percentage) {
    if (percentage >= 90) return 'Perfect score! You are a movie master!';
    if (percentage >= 80) return 'Great job! You know your movies!';
    if (percentage >= 60) return 'Good effort! Keep practicing!';
    if (percentage >= 40) return 'Not bad! Try again to improve!';
    return 'Keep trying! You will get better!';
}

function getMedalClass(index) {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
}

function hideAllSections() {
    const sections = document.querySelectorAll('main > section');
    sections.forEach(s => s.style.display = 'none');
}

// Export functions to window for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.startQuiz = startQuiz;
    window.previousQuestion = previousQuestion;
    window.nextQuestion = nextQuestion;
    window.submitQuiz = submitQuiz;
    window.retryQuiz = retryQuiz;
    window.startQuiz = startQuiz;
    window.loadQuizzes = loadQuizzes;
    window.viewQuizDetails = viewQuizDetails;
}