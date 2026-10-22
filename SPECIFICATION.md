# MyQuizApp - Specification Document

**Project Type:** High School AI-Assisted Web Development Project  
**Status:** Specification Phase  
**Version:** 1.0  
**Date:** October 2024

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [User Roles and Permissions](#2-user-roles-and-permissions)
3. [Core Features](#3-core-features)
4. [Technical Stack](#4-technical-stack)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [Security Requirements](#7-security-requirements)
8. [Development Phases](#8-development-phases)
9. [Student Feature Requirements](#9-student-feature-requirements)
10. [CSV Import Specification](#10-csv-import-specification)
11. [File Structure](#11-file-structure)

---

## 1. Project Overview

### 1.1 Purpose
MyQuizApp is a web-based quiz application designed for classroom use. It allows teachers to create and manage quizzes, while students can take quizzes, track their progress, and compete on leaderboards.

### 1.2 Target Users
- **Students/Players:** Take quizzes, view scores, track history, see leaderboards
- **Teachers/Admins:** Create quizzes, manage questions, view all data

### 1.3 Minimum Viable Product (MVP)
- 5 quizzes with 10+ questions each
- User authentication (register, login, logout)
- Quiz taking with scoring
- Attempt history
- Per-quiz and overall leaderboards
- Question editor for teachers
- CSV question import

---

## 2. User Roles and Permissions

### 2.1 Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Guest** | Unauthenticated user | View login page, view register page |
| **Player** | Registered student | Take quizzes, view own scores, view own history, view leaderboards, retry quizzes |
| **Teacher/Admin** | Instructor | All Player permissions + create/edit quizzes, create/edit questions, upload CSV questions, view all user data, view all attempt history |

### 2.2 Authentication Flow
```
Guest → Register → Player (automatic)
Guest → Login → Player or Teacher
Player/Teacher → Logout → Guest
```

### 2.3 Role Assignment
- First user to register becomes **Admin** (or use environment variable)
- Teachers can be designated by Admin users
- Default role for new registrations: **Player**

---

## 3. Core Features

### 3.1 Quiz System

#### 3.1.1 Quiz Structure
- Each quiz has:
  - Unique ID
  - Title (string, 3-100 characters)
  - Description (string, optional, max 500 characters)
  - Category/topic (string, optional)
  - Created date/time
  - Owner (user who created it)
  - Is published (boolean, default: true)

#### 3.1.2 Question Structure
- Each question has:
  - Unique ID
  - Quiz ID (foreign key)
  - Question text (string, 10-500 characters)
  - Four answer choices (array of strings, each 1-200 characters)
  - Correct answer index (0-3, integer)
  - Points value (integer, default: 1)
  - Order/position (integer)

### 3.2 Quiz Taking Flow
```
1. User selects quiz from list
2. System loads quiz with all questions
3. User answers questions one at a time (or all at once - TBD)
4. User submits quiz
5. System calculates score: (correct answers / total questions) * 100
6. System records attempt in database
7. System displays score and percentage
8. User can retry (creates new attempt)
```

### 3.3 Scoring Rules
- Each correct answer: +1 point (or custom points per question)
- Each incorrect answer: 0 points
- Unanswered questions: 0 points
- Score = total points earned
- Percentage = (score / total possible points) * 100
- Rounded to 2 decimal places

### 3.4 Attempt Tracking
- **Completed Attempt:** User has submitted all answers
- **Unfinished Attempt:** User started but did not submit (NOT saved)
- Each attempt records:
  - User ID
  - Quiz ID
  - Score (integer)
  - Total questions (integer)
  - Percentage (float, 0-100)
  - Completion timestamp
  - Time taken (optional, in seconds)

### 3.5 Leaderboards

#### 3.5.1 Overall Leaderboard
- Ranks ALL users by:
  - Primary: Total completed quiz attempts (descending)
  - Secondary: Total score across all attempts (descending)
  - Tertiary: Username (ascending)
- Displays: Rank, Username, Total Attempts, Total Score

#### 3.5.2 Per-Quiz Leaderboard
- For each quiz, ranks users by:
  - Primary: Highest score achieved (descending)
  - Secondary: Number of completed attempts for this quiz (descending)
  - Tertiary: Most recent high score date (descending)
- Displays: Rank, Username, Highest Score, Attempts Count, Last High Score Date
- Only shows users who have at least one completed attempt

### 3.6 User History
- Each user can view:
  - All their completed attempts
  - Quiz name, score, percentage, date/time
  - Sorted by: Most recent first (default), or by quiz, or by score

---

## 4. Technical Stack

### 4.1 Frontend
- **Languages:** Plain HTML5, CSS3, JavaScript (ES6+)
- **No frameworks:** Vanilla JS only (no React, Vue, etc.)
- **Styling:** Custom CSS, no CSS frameworks
- **Structure:** Single-page application with dynamic content loading

### 4.2 Backend
- **Runtime:** Node.js 24 LTS
- **Framework:** Express 5.x
- **Package Manager:** npm (with package-lock.json committed)
- **Static Files:** Served by Express static middleware

### 4.3 Database
- **Provider:** Replit PostgreSQL
- **Client:** `pg` library with parameterized SQL queries
- **Structure:** Single database with multiple tables
- **Persistence:** Data remains after app restart

### 4.4 Environments

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| Local Development | Coding & testing | Local PostgreSQL or Replit dev DB | localhost:3000 |
| Replit Workspace | QA/Testing | Replit development DB | replit.dev |
| Replit Deployment | Production | Separate production DB | Custom domain |

### 4.5 Environment Variables
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myquizapp
DB_USER=postgres
DB_PASSWORD=secure_password

# Session
SESSION_SECRET=random_secure_string

# App
PORT=3000
NODE_ENV=development

# First user becomes admin
FIRST_USER_IS_ADMIN=true
```

---

## 5. Database Schema

### 5.1 Tables

#### 5.1.1 users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5.1.2 quizzes
```sql
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5.1.3 questions
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    choices JSONB NOT NULL, -- Array of 4 strings
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0 AND correct_answer_index <= 3),
    points INTEGER DEFAULT 1,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5.1.4 attempts
```sql
CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_taken INTEGER -- in seconds, optional
);
```

### 5.2 Indexes
```sql
-- For faster user lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- For quiz listings
CREATE INDEX idx_quizzes_owner ON quizzes(owner_id);
CREATE INDEX idx_quizzes_published ON quizzes(is_published);

-- For attempt queries
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX idx_attempts_completed ON attempts(completed_at);

-- For leaderboards
CREATE INDEX idx_attempts_user_quiz ON attempts(user_id, quiz_id);
```

### 5.3 Triggers
```sql
-- Update updated_at on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. API Design

### 6.1 Base URL
- Development: `http://localhost:3000/api`
- Production: `/api`

### 6.2 Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |

### 6.3 Quiz Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/quizzes` | List all published quizzes | No | - |
| GET | `/api/quizzes/:id` | Get quiz details with questions | Yes | Player+ |
| GET | `/api/quizzes/all` | List all quizzes (including unpublished) | Yes | Teacher+ |
| POST | `/api/quizzes` | Create new quiz | Yes | Teacher+ |
| PUT | `/api/quizzes/:id` | Update quiz metadata | Yes | Teacher+ |
| DELETE | `/api/quizzes/:id` | Delete quiz | Yes | Teacher+ |

### 6.4 Question Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/questions/quiz/:quizId` | Get all questions for a quiz | Yes | Player+ |
| POST | `/api/questions` | Create new question | Yes | Teacher+ |
| PUT | `/api/questions/:id` | Update question | Yes | Teacher+ |
| DELETE | `/api/questions/:id` | Delete question | Yes | Teacher+ |

### 6.5 Attempt Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/attempts` | Submit quiz attempt | Yes | Player+ |
| GET | `/api/attempts/me` | Get current user's attempt history | Yes | Player+ |
| GET | `/api/attempts/quiz/:quizId` | Get attempts for a specific quiz | Yes | Teacher+ |
| GET | `/api/attempts/user/:userId` | Get attempts for a specific user | Yes | Teacher+ |

### 6.6 Leaderboard Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/leaderboard` | Overall leaderboard | Yes | Player+ |
| GET | `/api/leaderboard/quiz/:quizId` | Per-quiz leaderboard | Yes | Player+ |

### 6.7 CSV Import Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/import/preview` | Preview CSV import | Yes | Teacher+ |
| POST | `/api/import` | Import validated CSV | Yes | Teacher+ |

### 6.8 Response Format

#### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Operation successful"
}
```

#### Error Response
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message"
    }
}
```

#### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Login failed
- `AUTHORIZATION_ERROR` - User doesn't have permission
- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Duplicate entry (e.g., username exists)
- `INTERNAL_ERROR` - Server error

---

## 7. Security Requirements

### 7.1 Password Storage
- **NEVER** store plain text passwords
- Use **bcrypt** for password hashing
- Minimum 10 rounds of hashing
- Salt is automatically handled by bcrypt

### 7.2 Session Management
- Use **express-session** with secure configuration
- Session secret stored in environment variables
- Cookies:
  - `httpOnly: true` (prevent XSS)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'strict'` or `'lax'`
  - `maxAge: 24 * 60 * 60 * 1000` (24 hours)

### 7.3 SQL Injection Prevention
- **ALWAYS** use parameterized queries with `pg`
- Never use string concatenation for SQL
- Example of parameterized query:
```javascript
// GOOD
const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
);

// BAD - NEVER DO THIS
const result = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
);
```

### 7.4 Input Validation
- Validate all user input on both client and server
- Use **express-validator** middleware
- Sanitize input to prevent XSS

### 7.5 CSRF Protection
- Use **csurf** middleware or implement CSRF tokens
- Tokens included in forms and AJAX requests

### 7.6 Rate Limiting
- Implement rate limiting on authentication endpoints
- Prevent brute force attacks
- Use **express-rate-limit**

### 7.7 CORS
- Configure CORS for API endpoints
- Restrict origins in production

---

## 8. Development Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up project structure, database, and basic authentication

#### Tasks:
- [ ] Initialize GitHub repository
- [ ] Set up Node.js/Express project with npm
- [ ] Configure PostgreSQL database on Replit
- [ ] Create database schema and tables
- [ ] Implement user model and authentication
- [ ] Password hashing with bcrypt
- [ ] Session management
- [ ] Basic server routes (health check, etc.)
- [ ] Simple frontend login/register pages
- [ ] Connect to Replit database

#### Deliverables:
- Working project structure
- Database with all tables created
- User can register, login, logout
- Sessions persist across page refreshes

#### Success Criteria:
- [ ] `npm start` runs without errors
- [ ] Can register a new user
- [ ] Can login and logout
- [ ] Password is hashed in database

---

### Phase 2: Core Quiz Functionality (Week 2)
**Goal:** Implement quiz management and basic quiz taking

#### Tasks:
- [ ] Quiz model and CRUD operations
- [ ] Question model and CRUD operations
- [ ] Create 5 sample quizzes with 10+ questions each
- [ ] Quiz listing page (shows all published quizzes)
- [ ] Quiz detail page (shows quiz info)
- [ ] Quiz taking interface
- [ ] Score calculation
- [ ] Attempt recording in database
- [ ] Results page showing score and percentage
- [ ] Retry functionality

#### Deliverables:
- 5 quizzes with questions in database
- Users can select and take quizzes
- Scores are calculated and displayed
- Attempts are saved to database

#### Success Criteria:
- [ ] Can view list of quizzes
- [ ] Can start a quiz
- [ ] Can answer all questions and submit
- [ ] Score is calculated correctly
- [ ] Can retry the same quiz
- [ ] All attempts are saved

---

### Phase 3: User Features (Week 3)
**Goal:** Implement user-specific features and leaderboards

#### Tasks:
- [ ] User profile page
- [ ] Attempt history page
- [ ] Overall leaderboard implementation
- [ ] Per-quiz leaderboard implementation
- [ ] Role-based access control
- [ ] Teacher/admin dashboard
- [ ] Question editor UI for teachers
- [ ] Create/edit questions interface
- [ ] Assign questions to quizzes

#### Deliverables:
- Users can view their own history
- Leaderboards display correctly
- Teachers can create/edit questions
- Role-based UI (teachers see more options)

#### Success Criteria:
- [ ] Can view own attempt history
- [ ] Overall leaderboard shows correct rankings
- [ ] Per-quiz leaderboard shows correct rankings
- [ ] Teacher can create a new quiz
- [ ] Teacher can add questions to a quiz
- [ ] Player cannot access teacher features

---

### Phase 4: Advanced Features (Week 4)
**Goal:** Implement CSV import and polish the application

#### Tasks:
- [ ] CSV import template design
- [ ] CSV preview endpoint
- [ ] CSV validation logic
- [ ] CSV import functionality
- [ ] Error handling for invalid CSV rows
- [ ] Feedback on import results
- [ ] UI for CSV upload
- [ ] Preview validation errors before import
- [ ] Bug fixes from previous phases
- [ ] Performance optimizations

#### Deliverables:
- CSV template for question import
- Teachers can upload questions via CSV
- Invalid rows are identified before import
- Import confirmation and error reporting

#### Success Criteria:
- [ ] Can download CSV template
- [ ] Can upload valid CSV and import questions
- [ ] Invalid CSV rows are flagged with errors
- [ ] Can preview import before confirming
- [ ] Imported questions appear in correct quiz

---

### Phase 5: Student Features & Deployment (Week 5)
**Goal:** Each student implements 2 additional features and deploys to production

#### Tasks:
- [ ] **STUDENT-SPECIFIC:** Design and implement Feature #1
- [ ] **STUDENT-SPECIFIC:** Design and implement Feature #2
- [ ] Write tests for new features
- [ ] Final QA testing
- [ ] Deploy to Replit Deployment
- [ ] Set up production database
- [ ] Configure environment variables for production
- [ ] Final documentation updates

#### Feature Ideas (Pick 2, or propose your own):
1. **Timer for quizzes** - Add time limit per quiz, auto-submit when time expires
2. **Question shuffle** - Randomize question order for each attempt
3. **Answer shuffle** - Randomize answer choice order for each attempt
4. **Quiz categories** - Organize quizzes by category with filtering
5. **Search quizzes** - Search quizzes by title or description
6. **User profile pictures** - Allow users to upload profile images
7. **Quiz feedback** - Show which questions were wrong after submission
8. **Partial credit** - Support multiple correct answers with partial credit
9. **Quiz scheduling** - Teachers can schedule quiz availability
10. **Export attempt data** - Teachers can export attempt data as CSV
11. **Multi-page quizzes** - Split long quizzes across multiple pages
12. **Question hints** - Optional hints for questions
13. **Difficulty levels** - Mark questions as easy/medium/hard
14. **Quiz duplicates** - Allow teachers to duplicate existing quizzes
15. **Bulk quiz operations** - Delete/move multiple questions at once

#### Deliverables:
- 2 additional functional features implemented
- All features working in deployed app
- Production deployment on Replit
- Final documentation

#### Success Criteria:
- [ ] 2 additional features are functional
- [ ] All required features still work
- [ ] App is deployed to Replit Deployment
- [ ] Production database is separate from development
- [ ] All tests pass

---

## 9. Student Feature Requirements

### 9.1 Rules
- Each student must implement **2 additional functional features**
- Required features (from sections 3-6) **do not count**
- Cosmetic changes (CSS styling, UI tweaks) **do not count**
- Features must be **functional** (add new capability)
- Features must work in the **deployed production app**

### 9.2 Documentation
- Each feature must be documented in this spec
- Add a new section: "9.3 Student-Implemented Features"
- Document:
  - Feature name and description
  - How it works
  - API endpoints (if any)
  - Database changes (if any)
  - UI changes

### 9.3 Feature Selection Process
1. Review the list of feature ideas in Phase 5
2. Choose 2 features that interest you
3. Get approval from teacher
4. Add feature specifications to this document
5. Implement and test features

---

## 10. CSV Import Specification

### 10.1 Template Format

```csv
quiz_title,question_text,choice_1,choice_2,choice_3,choice_4,correct_answer,points
"Math Quiz","What is 2+2?","3","4","5","6","4",1
"Math Quiz","What is 3*3?","7","8","9","10","9",1
```

### 10.2 CSV Structure

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| quiz_title | Yes | String | Name of the quiz to add question to |
| question_text | Yes | String | The question text |
| choice_1 | Yes | String | First answer choice |
| choice_2 | Yes | String | Second answer choice |
| choice_3 | Yes | String | Third answer choice |
| choice_4 | Yes | String | Fourth answer choice |
| correct_answer | Yes | String or Integer | The correct choice (can be the text or index 1-4) |
| points | No | Integer | Points for this question (default: 1) |

### 10.3 Validation Rules

#### Row-Level Validation:
- All required columns must be present
- quiz_title must match an existing quiz (or create new if configured)
- question_text must be 10-500 characters
- Each choice must be 1-200 characters
- Exactly 4 choices must be provided
- correct_answer must match one of the 4 choices OR be a valid index (1-4)
- points must be a positive integer (default: 1)

#### File-Level Validation:
- File must be valid CSV
- File size limit: 5MB
- Maximum rows: 1000
- First row must be header row

### 10.4 Error Handling

For each invalid row, report:
- Row number
- Column with error
- Error type and message

Example error response:
```json
{
    "success": false,
    "errors": [
        {
            "row": 3,
            "column": "question_text",
            "message": "Question text must be at least 10 characters"
        },
        {
            "row": 5,
            "column": "correct_answer",
            "message": "Correct answer must be one of the provided choices"
        }
    ],
    "validRows": 8,
    "invalidRows": 2
}
```

### 10.5 Import Process

1. User uploads CSV file
2. Server validates file format
3. Server parses CSV and validates each row
4. Server returns preview with:
   - Valid rows (will be imported)
   - Invalid rows with errors
5. User reviews and confirms
6. Server imports valid rows
7. Server returns import summary

---

## 11. File Structure

```
myquizapp/
├── SPECIFICATION.md          # This document
├── README.md                 # Project overview, setup instructions
├── package.json
├── package-lock.json
├── .env                      # Environment variables (gitignored)
├── .env.example              # Example environment variables
├── .gitignore
├── 
├── public/                   # Static files
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── app.js           # Main application JS
│   │   ├── auth.js          # Authentication logic
│   │   ├── quizzes.js       # Quiz-related logic
│   │   └── api.js           # API client
│   └── index.html           # Main HTML entry point
│
├── src/                      # Server code
│   ├── app.js               # Express application setup
│   ├── server.js            # Server entry point
│   ├── config/
│   │   ├── db.js            # Database connection
│   │   └── passport.js      # Authentication config
│   ├── models/
│   │   ├── User.js          # User model
│   │   ├── Quiz.js          # Quiz model
│   │   ├── Question.js      # Question model
│   │   └── Attempt.js       # Attempt model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── quizzes.js       # Quiz routes
│   │   ├── questions.js     # Question routes
│   │   ├── attempts.js      # Attempt routes
│   │   ├── leaderboard.js   # Leaderboard routes
│   │   ├── import.js        # CSV import routes
│   │   └── index.js         # Route aggregator
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   └── validation.js    # Input validation
│   ├── utils/
│   │   ├── helpers.js       # Helper functions
│   │   └── csvParser.js     # CSV parsing utilities
│   └── migrations/          # Database migrations
│       └── init.sql         # Initial schema
│
├── views/                   # Optional: Server-side templates
│   └── partials/            # HTML partials
│
├── tests/                   # Tests (optional for this project)
│   └── ...
│
└── docs/                    # Additional documentation
    └── ...
```

---

## 12. Next Steps

1. **Review this specification** with your team and teacher
2. **Approve or modify** any design decisions
3. **Assign tasks** for Phase 1
4. **Begin implementation** following the phase structure

---

## Appendix A: Sample Data

### Sample Quizzes
1. **Math Basics** - Basic arithmetic questions
2. **World History** - Historical events and dates
3. **Science Fundamentals** - Basic science concepts
4. **English Literature** - Literary works and authors
5. **Computer Science** - Programming and CS concepts

### Sample Questions (Math Basics)
1. What is 2 + 2? (Answer: 4)
2. What is 5 * 3? (Answer: 15)
3. What is 10 - 7? (Answer: 3)
4. What is 8 / 2? (Answer: 4)
5. What is 2^3? (Answer: 8)
6. What is the square root of 16? (Answer: 4)
7. What is 15% of 100? (Answer: 15)
8. What is 7 + 8? (Answer: 15)
9. What is 12 / 4? (Answer: 3)
10. What is 9 * 9? (Answer: 81)

---

*Document Status: Draft - Ready for Review*
*Last Updated: October 2024*
