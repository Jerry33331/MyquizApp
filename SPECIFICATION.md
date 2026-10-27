# MyQuizApp - Specification Document

**Project Type:** High School AI-Assisted Web Development Project  
**Status:** Specification Phase (Final)  
**Version:** 2.0  
**Date:** October 2024

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Theme and Design](#2-theme-and-design)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [Core Features](#4-core-features)
5. [Custom Student Features](#5-custom-student-features)
6. [Quiz Content](#6-quiz-content)
7. [Technical Stack](#7-technical-stack)
8. [User Experience and Navigation](#8-user-experience-and-navigation)
9. [Page Design Details](#9-page-design-details)
10. [Leaderboard Rules](#10-leaderboard-rules)
11. [Database Schema](#11-database-schema)
12. [API Design](#12-api-design)
13. [Security Requirements](#13-security-requirements)
14. [Development Phases](#14-development-phases)
15. [CSV Import Specification](#15-csv-import-specification)
16. [File Structure](#16-file-structure)

---

## 1. Project Overview

### 1.1 Purpose
MyQuizApp is a **movie-themed** web-based quiz application designed for classroom use with a **game show aesthetic**. It allows teachers (admins) to create and manage quizzes, while students can take quizzes, track their progress, and compete on leaderboards in an engaging, colorful interface.

### 1.2 Target Users
- **Students/Players:** High school classmates who take movie quizzes, view scores, track history, see leaderboards
- **Admins:** Instructors who create quizzes, manage questions, view all data

### 1.3 Minimum Viable Product (MVP)
- 5 **movie-themed** quizzes with 10+ questions each (pre-loaded in database)
- User authentication (register, login, logout)
- Quiz taking with scoring in a game show style interface
- Attempt history
- Per-quiz and overall leaderboards
- Question editor for admins
- CSV question import

### 1.4 Decisions Summary
| Decision | Choice |
|----------|--------|
| App Name | MyQuizApp (kept) |
| Theme | Game Show / Kahoot-style |
| Quiz Topics | All movie-related (Action, Comedy, Horror, Animated, Superhero) |
| First Admin | First user to register becomes admin automatically |
| 5 Quizzes | Pre-loaded with movie questions in Phase 1 |
| Complete Quiz | Means submitting all answers |
| Quiz Assignments | Means assigning questions to quizzes |
| Teacher vs Admin | Combined into single "admin" role |
| Delete Quiz | CASCADE - deletes all related questions and attempts |
| Teachers can edit | Any quiz and any question (no ownership restriction) |
| CSV Template | Format defined in Section 15 |
| Retry | Does NOT show previous answers (fresh attempt) |
| Tie-breaking | Username alphabetically (ascending) |
| Custom Feature 1 | Timer Challenge Mode |
| Custom Feature 2 | Movie Poster Display |

---

## 2. Theme and Design

### 2.1 Visual Theme
- **Name:** MyQuizApp
- **Theme:** Game Show / Kahoot-style
- **Primary Colors:** Bright Blue (#2D5BA3), Electric Purple (#8A2BE2), Vibrant Pink (#FF69B4), Sunny Yellow (#FFD700), Lime Green (#32CD32)
- **Background:** Deep Space Blue (#0F1419) for main backgrounds, White (#FFFFFF) for cards
- **Font:** Open Sans (clean, modern, readable) for body text; 'Bebas Neue' for movie-themed headings
- **Mood:** Energetic, competitive, fun - like a live game show

### 2.2 Design Elements
- Rounded corners on all cards and buttons (12-16px radius)
- Bold, high-contrast shadows for depth
- Colorful gradient backgrounds on quiz cards
- Each answer choice has a unique bright color (Blue, Purple, Pink, Orange)
- Answer cards glow and lift on hover
- Smooth animations and transitions between questions
- Consistent spacing (24-32px between sections, 20-24px within cards)
- Confetti/celebration effects on results page for high scores

### 2.3 Quiz Topics
All quizzes are **movie-themed**:
1. **Action Movie Trivia** - Iconic action scenes, actors, directors
2. **Comedy Movie Quotes** - Identify movies from famous quotes
3. **Horror Movie Knowledge** - Classic horror films, directors, facts
4. **Animated Movie Magic** - Disney, Pixar, DreamWorks films
5. **Superhero Movie Universe** - Marvel, DC, characters, actors

---

## 3. User Roles and Permissions

### 3.1 Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Guest** | Unauthenticated user | View login page, view register page, view quiz list (read-only) |
| **Player** | Registered student | Take quizzes, view own scores, view own history, view leaderboards, retry quizzes |
| **Admin** | Instructor | All Player permissions + create/edit/delete quizzes, create/edit/delete questions, upload CSV questions, view all user data, view all attempt history, manage users |

### 3.2 Role Assignment
- **First user to register** automatically becomes **Admin** (via database trigger)
- All subsequent registrations default to **Player**
- Admins can promote Players to Admins
- No self-demotion (Admins cannot change their own role to Player)

### 3.3 Authentication Flow
```
Guest → Register → Player (or Admin if first user)
Guest → Login → Player or Admin
Player/Admin → Logout → Guest
```

---

## 4. Core Features

### 4.1 Quiz System

#### 4.1.1 Quiz Structure
- Each quiz has:
  - Unique ID
  - Title (string, 3-100 characters)
  - Description (string, optional, max 500 characters)
  - Category (string, required: Action, Comedy, Horror, Animated, Superhero)
  - Owner (user who created it - Admin only)
  - Is published (boolean, default: true)
  - Difficulty (string: Easy, Medium, Hard, default: Medium)
  - Time limit (integer, in seconds, default: 0 = no limit) [Feature 1]

#### 4.1.2 Question Structure
- Each question has:
  - Unique ID
  - Quiz ID (foreign key)
  - Question text (string, 10-500 characters)
  - Four answer choices (array of strings, each 1-200 characters)
  - Correct answer index (0-3, integer)
  - Points value (integer, default: 1)
  - Order/position (integer)
  - Movie reference (string, optional - which movie this is about)
  - Image URL (string, optional, max 500 characters) [Feature 2]

### 4.2 Quiz Taking Flow
```
1. User selects quiz from list (must be logged in)
2. System loads quiz with all questions in order
3. User answers questions one at a time (single-page, scroll through)
4. User can navigate between questions (Previous/Next buttons)
5. User submits quiz (must answer all questions to complete)
6. System calculates score: sum of points for correct answers
7. System calculates percentage: (score / total possible points) * 100, rounded to 2 decimals
8. System records attempt in database with completed_at timestamp
9. System displays score, percentage, and correct/incorrect count
10. User can retry (creates new attempt, does NOT show previous answers)
```

**Note:** Unfinished attempts (user starts but doesn't submit) are NOT saved to database.

### 4.3 Scoring Rules
- Each correct answer: +points value of that question (default: 1)
- Each incorrect answer: 0 points
- Unanswered questions: Quiz cannot be submitted with unanswered questions
- Score = sum of points for all correct answers
- Percentage = (score / total possible points) * 100
- Rounded to 2 decimal places
- **Example:** 8 correct out of 10 questions worth 1 point each = Score: 8, Percentage: 80.00%

### 4.4 Attempt Tracking
- **Completed Attempt:** User has submitted all answers for a quiz
- **Unfinished Attempt:** User started but did not submit (NOT saved to database)
- Each attempt records:
  - User ID (foreign key)
  - Quiz ID (foreign key)
  - Score (integer, total points earned)
  - Total questions (integer, count of questions in quiz)
  - Percentage (numeric, 0-100, 2 decimal places)
  - Completion timestamp (TIMESTAMP WITH TIME ZONE)
  - Time taken (integer, in seconds, optional - calculated from start to submit)

### 4.5 Leaderboards

#### 4.5.1 Overall Leaderboard
- Ranks ALL users by:
  - Primary: Total completed quiz attempts (descending - more is better)
  - Secondary: Username alphabetically (ascending - A comes before B) [tie-breaker]
- Displays: Rank, Username, Total Completed Attempts
- Shows all registered users (even with 0 attempts)

#### 4.5.2 Per-Quiz Leaderboard
- For each quiz, ranks users by:
  - Primary: Highest score achieved on this quiz (descending)
  - Secondary: Number of completed attempts for this quiz (descending)
  - Tertiary: Username alphabetically (ascending) [tie-breaker]
- Displays: Rank, Username, Highest Score, Number of Attempts
- Only shows users who have at least one completed attempt for this quiz
- **Note:** Only the highest score per user per quiz is shown, not average or most recent

### 4.6 User History
- Each user can view their own:
  - All completed attempts
  - Quiz name, category, score, percentage, date/time
  - Default sort: Most recent first (descending by completed_at)
  - Can filter by: Quiz category, date range
  - Can sort by: Score (high to low), Quiz name (A-Z), Date (newest to oldest)

---

## 5. Custom Student Features

### 5.1 Feature Selection
**Two functional features beyond requirements:**

#### Feature 1: Timer Challenge Mode
- **What it does:** Adds optional time limit to quizzes. When enabled, users must complete the quiz within the time limit. If time runs out, the quiz auto-submits with whatever answers are filled.
- **Difficulty:** Easy
- **Data needed:** Add `time_limit` column (integer, in seconds) to quizzes table. Track `time_taken` in attempts.

**How it works:**
- Admins can set `time_limit` per quiz (0 = no limit, default)
- Timer displays on quiz page when `time_limit > 0`
- Timer counts down from `time_limit` in seconds
- At 0 seconds, auto-submit if not already submitted
- Time taken is recorded in attempt
- Users see timer turning red when under 30 seconds
- Quiz cannot be paused once started when timer is active

#### Feature 2: Movie Poster Display
- **What it does:** Displays movie poster images next to questions to make the quiz more visual and engaging.
- **Difficulty:** Medium
- **Data needed:** Add `image_url` column (string, optional) to questions table.

**How it works:**
- Admins can add image URLs when creating/editing questions
- Images are displayed above the question text
- Images are resized to fit (max width: 300px, max height: 400px)
- If image fails to load, show placeholder movie reel icon
- Uses direct image URLs (hotlinking to free movie poster sites)
- Images are centered and have a subtle green border

---

## 6. Quiz Content

### 6.1 Quiz Topics (Movie-Themed)

#### Quiz 1: Action Movie Trivia
- **Category:** Action
- **Difficulty:** Medium
- **Description:** Test your knowledge of action movies, iconic scenes, and actors

| # | Question | Choice A | Choice B | Choice C | Choice D | Correct |
|---|----------|----------|----------|----------|----------|---------|
| 1 | Which actor played John McClane in the Die Hard series? | Arnold Schwarzenegger | Sylvester Stallone | Bruce Willis | Jason Statham | Bruce Willis |
| 2 | In The Matrix, what color pill does Neo take? | Red | Blue | Green | White | Red |
| 3 | What is the name of the villain in The Dark Knight? | Bane | Scarecrow | The Joker | Two-Face | The Joker |
| 4 | Which movie features the line "I'll be back"? | Rambo | Terminator 2 | Predator | Commando | Terminator 2 |
| 5 | What type of martial arts is Keanu Reeves known for in John Wick? | Karate | Jiu-Jitsu | Kung Fu | Judo | Jiu-Jitsu |
| 6 | In Mission: Impossible, what is Ethan Hunt's profession? | Detective | Spy | Soldier | Hacker | Spy |
| 7 | Which action movie features a character named Dutch? | Die Hard | Predator | The Terminator | Lethal Weapon | Predator |
| 8 | What is the name of the main character in the Mad Max series? | Max Rockatansky | Max Payne | Max Steel | Max Damage | Max Rockatansky |
| 9 | In Fast & Furious, what is Dominic Toretto's nickname? | Dom | D | Big D | Toretto | Dom |
| 10 | Which of these is NOT a James Bond actor? | Sean Connery | Roger Moore | Tom Cruise | Pierce Brosnan | Tom Cruise |
| 11 | What is the weapon of choice for John Wick? | Sniper Rifle | Shotgun | Pencil | Handgun | Pencil |
| 12 | In the movie 300, what is the name of the battle? | Battle of Troy | Battle of Thermopylae | Battle of Sparta | Battle of Athens | Battle of Thermopylae |

#### Quiz 2: Comedy Movie Quotes
- **Category:** Comedy
- **Difficulty:** Medium
- **Description:** Identify movies from their famous comedy quotes

| # | Question | Choice A | Choice B | Choice C | Choice D | Correct |
|---|----------|----------|----------|----------|----------|---------|
| 1 | "Here's looking at you, kid." is from which movie? | Casablanca | The Hangover | Airplane | Dumb and Dumber | Casablanca |
| 2 | Which movie has the quote "You can't handle the truth!"? | Liar Liar | A Few Good Men | The Big Lebowski | Forrest Gump | A Few Good Men |
| 3 | "Life is like a box of chocolates" is from which film? | The Shawshank Redemption | Forrest Gump | Big | Jerry Maguire | Forrest Gump |
| 4 | "I'm king of the world!" was yelled by Leonardo DiCaprio in which movie? | The Wolf of Wall Street | Inception | Titanic | The Revenant | Titanic |
| 5 | Which comedy features the line "Nobody puts Baby in a corner"? | Dirty Dancing | Ferris Bueller's Day Off | The Princess Bride | Clueless | Dirty Dancing |
| 6 | "To infinity and beyond!" is the catchphrase of which character? | Shrek | Buzz Lightyear | Woody | Mickey Mouse | Buzz Lightyear |
| 7 | "I'll have what she's having" is from which romantic comedy? | When Harry Met Sally | Sleepless in Seattle | You've Got Mail | Notting Hill | When Harry Met Sally |
| 8 | Which movie: "You had me at hello"? | The Notebook | Jerry Maguire | Sleepless in Seattle | Pretty Woman | Jerry Maguire |
| 9 | "Wax on, wax off" is a famous line from which 80s movie? | The Karate Kid | Back to the Future | Ghostbusters | Ferris Bueller's Day Off | The Karate Kid |
| 10 | "I'm not bad, I'm just drawn that way" was said by which character? | Jessica Rabbit | Betty Boop | Minnie Mouse | Daisy Duck | Jessica Rabbit |
| 11 | Which movie: "Show me the money!"? | Wall Street | The Wolf of Wall Street | Jerry Maguire | Moneyball | Jerry Maguire |
| 12 | "Why so serious?" is a quote from which movie? | The Joker (The Dark Knight) | Batman Begins | Superman | Spider-Man | The Joker (The Dark Knight) |

#### Quiz 3: Horror Movie Knowledge
- **Category:** Horror
- **Difficulty:** Hard
- **Description:** Test your knowledge of horror movies, directors, and facts

| # | Question | Choice A | Choice B | Choice C | Choice D | Correct |
|---|----------|----------|----------|----------|----------|---------|
| 1 | Which director is known as the "Master of Horror"? | Steven Spielberg | Wes Craven | Alfred Hitchcock | Stanley Kubrick | Alfred Hitchcock |
| 2 | In The Exorcist, what is the name of the possessed girl? | Regan | Emily | Sarah | Linda | Regan |
| 3 | Which horror movie features the line "Here's Johnny!"? | The Shining | Poltergeist | A Nightmare on Elm Street | Halloween | The Shining |
| 4 | What is the name of the killer in the Scream movies? | Ghostface | Michael Myers | Jason Voorhees | Freddy Krueger | Ghostface |
| 5 | In A Nightmare on Elm Street, where does Freddy Krueger attack? | In dreams | In the shower | In the woods | In the basement | In dreams |
| 6 | Which horror franchise features a character named Jigsaw? | Saw | Paranormal Activity | The Conjuring | Insidious | Saw |
| 7 | What is the name of the hotel in The Shining? | The Overlook Hotel | The Stanley Hotel | The Haunted Hotel | The Mountain View Hotel | The Overlook Hotel |
| 8 | In Halloween, what is Michael Myers' weapon of choice? | Axe | Chainsaw | Knife | Machete | Knife |
| 9 | Which of these is NOT a Stephen King novel adaptation? | It | The Exorcist | Pet Sematary | The Shining | The Exorcist |
| 10 | What year was the original Psycho released? | 1958 | 1960 | 1962 | 1965 | 1960 |
| 11 | In The Conjuring, what are the names of the demonologists? | Ed and Lorraine Warren | Sam and Dean Winchester | Peter and Ray Stantz | Dana and Zuul | Ed and Lorraine Warren |
| 12 | Which horror movie features a clown named Pennywise? | It | The Ring | Poltergeist | Child's Play | It |

#### Quiz 4: Animated Movie Magic
- **Category:** Animated
- **Difficulty:** Easy
- **Description:** Questions about Disney, Pixar, DreamWorks and other animated films

| # | Question | Choice A | Choice B | Choice C | Choice D | Correct |
|---|----------|----------|----------|----------|----------|---------|
| 1 | Which company produced Toy Story? | DreamWorks | Pixar | Disney | Universal | Pixar |
| 2 | What is the name of Simba's father in The Lion King? | Scar | Mufasa | Timon | Rafiki | Mufasa |
| 3 | In Finding Nemo, what kind of fish is Nemo? | Shark | Clownfish | Goldfish | Angel fish | Clownfish |
| 4 | Which Disney princess has a raccoon as a sidekick? | Pocahontas | Belle | Ariel | Jasmine | Pocahontas |
| 5 | What is the name of the boy in The Jungle Book? | Mowgli | Baloo | Shere Khan | Akela | Mowgli |
| 6 | In Shrek, what does Shrek turn into at the end? | Prince | Human | Ogre | Dragon | Human |
| 7 | Which movie features the song "Let It Go"? | Tangled | Brave | Moana | Frozen | Frozen |
| 8 | What is the name of the robot in WALL-E? | EVE | WALL-E | MAR-Y | Both A and B | Both A and B |
| 9 | In Despicable Me, what are the little yellow characters called? | Minions | Henchmen | Sidekicks | Helpers | Minions |
| 10 | Which Disney movie features a magic carpet? | Aladdin | Beauty and the Beast | Cinderella | Sleeping Beauty | Aladdin |
| 11 | What is the name of the villain in The Little Mermaid? | Maleficent | Ursula | Cruella | Jafar | Ursula |
| 12 | In Inside Out, what are the main characters? | Emotions | Toys | Animals | Superheroes | Emotions |

#### Quiz 5: Superhero Movie Universe
- **Category:** Superhero
- **Difficulty:** Medium
- **Description:** Questions about Marvel, DC, and other superhero movies

| # | Question | Choice A | Choice B | Choice C | Choice D | Correct |
|---|----------|----------|----------|----------|----------|---------|
| 1 | Who plays Iron Man in the Marvel Cinematic Universe? | Chris Evans | Robert Downey Jr. | Chris Hemsworth | Mark Ruffalo | Robert Downey Jr. |
| 2 | What is the name of Thor's hammer? | Vanir | Asgard | Mjolnir | Odin | Mjolnir |
| 3 | In The Avengers, what is the name of the team's headquarters? | Avengers Tower | Stark Tower | Avengers Mansion | Shield HQ | Avengers Tower |
| 4 | Which superhero says "I am Groot"? | Rocket | Star-Lord | Groot | Drax | Groot |
| 5 | What is the real name of Spider-Man? | Peter Parker | Tony Stark | Steve Rogers | Bruce Wayne | Peter Parker |
| 6 | In the Dark Knight trilogy, who plays Batman? | Val Kilmer | George Clooney | Michael Keaton | Christian Bale | Christian Bale |
| 7 | What is the name of Captain America's shield made of? | Steel | Vibranium | Adamantium | Titanium | Vibranium |
| 8 | Which superhero can shrink to the size of an ant? | Ant-Man | The Wasp | Both A and B | Neither | Both A and B |
| 9 | In Black Panther, what is the name of the country? | Wakanda | Zamunda | Genovia | Latveria | Wakanda |
| 10 | What is the name of the villain in Spider-Man: Homecoming? | Green Goblin | Doctor Octopus | Vulture | Venom | Vulture |
| 11 | Which superhero is known as the "Scarlet Speedster"? | The Flash | Quicksilver | Speedy | Zoom | The Flash |
| 12 | In Guardians of the Galaxy, what is the name of the talking raccoon? | Rocket | Star-Lord | Groot | Drax | Rocket |

---

## 7. Technical Stack

### 7.1 Frontend
- **Languages:** Plain HTML5, CSS3, JavaScript (ES6+)
- **No frameworks:** Vanilla JS only (no React, Vue, etc.)
- **Styling:** Custom CSS with green/cozy theme, no CSS frameworks
- **Structure:** Single-page application with dynamic content loading

### 7.2 Backend
- **Runtime:** Node.js 24 LTS
- **Framework:** Express 5.x
- **Package Manager:** npm (with package-lock.json committed)
- **Static Files:** Served by Express static middleware

### 7.3 Database
- **Provider:** Replit PostgreSQL
- **Client:** `pg` library with parameterized SQL queries
- **Structure:** Single database with multiple tables
- **Persistence:** Data remains after app restart

### 7.4 Environments

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| Local Development | Coding & testing | Local PostgreSQL or Replit dev DB | localhost:3000 |
| Replit Workspace | QA/Testing | Replit development DB | replit.dev |
| Replit Deployment | Production | Separate production DB | Custom domain |

### 7.5 Environment Variables
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
```

---

## 8. User Experience and Navigation

### 8.1 User Journeys

#### 8.1.1 New Player Journey
1. **Landing Page** - Sees app name, description, Login/Register buttons with green/cozy theme
2. **Register Page** - Enters username, email, password, confirms password
3. **Login Page** - Enters email/username and password
4. **Home Page** - Sees list of all published quizzes with categories and green cards
5. **Select Quiz** - Clicks on a quiz card
6. **Quiz Instructions** - Sees quiz title, description, number of questions, category, difficulty
7. **Start Quiz** - Clicks "Start Quiz" button
8. **Quiz Page** - Sees first question with 4 answer choices, navigation buttons (Previous/Next), timer if enabled
9. **Answer Questions** - Selects answer for each question, navigates through all questions
10. **Submit Quiz** - Clicks "Submit" after answering all questions
11. **Results Page** - Sees score, percentage, correct/incorrect count with green theme
12. **Retry Option** - Can click "Try Again" to restart the same quiz (fresh attempt)

#### 8.1.2 Returning Player Journey
1. **Login** - Enters credentials
2. **Home Page** - Sees quiz list
3. **My History** - Clicks "My History" in navigation, sees all past attempts
4. **Leaderboards** - Clicks "Leaderboards" to see overall and per-quiz rankings
5. **Select & Take Quiz** - Same as new player

#### 8.1.3 Admin Journey
1. **Login** - As admin (first user or promoted)
2. **Home Page** - Sees quiz list with "Edit" and "Delete" buttons
3. **Create Quiz** - Clicks "Create Quiz", enters title, description, category, difficulty, time limit
4. **Add Questions** - For new quiz, clicks "Add Question", enters question text, 4 choices, correct answer, movie reference, image URL
5. **Edit Quiz** - Can edit any quiz's metadata
6. **Edit Questions** - Can edit any question in any quiz
7. **CSV Import** - Clicks "Import Questions", uploads CSV, previews, confirms
8. **View All Attempts** - Clicks "All Attempts" to see every user's history
9. **Manage Users** - Can view all users, promote to admin

### 8.2 Navigation Structure

**Global Navigation (shown to all logged-in users):**
- Home (logo) - Go to quiz list
- Quizzes - List all quizzes (with category filters)
- My History - View own attempt history
- Leaderboards - View overall and per-quiz leaderboards
- Logout - End session

**Admin-Only Navigation:**
- Create Quiz - Create new quiz
- Import CSV - Upload questions from CSV
- All Attempts - View all user attempts
- Manage Users - User management

**Contextual Buttons:**
- On quiz card: Start Quiz, Edit (admin), Delete (admin)
- On question: Edit (admin), Delete (admin)
- On attempt history: View Details, Retry Quiz
- On leaderboard: Switch between Overall and Per-Quiz tabs

---

## 9. Page Design Details

### 9.1 Page Layouts

#### 9.1.1 Landing Page (Guest View)
- **Header:** MyQuizApp logo with movie reel icon, tagline "Test Your Movie Knowledge"
- **Navigation:** Login button (green), Register button (sage green outline)
- **Main Content:** Brief description, feature highlights, 3 preview quiz cards
- **Footer:** Copyright, version info, "A Class Project"
- **Design:** Forest green gradient background, cozy movie theater feel with subtle film strip pattern

#### 9.1.2 Home Page (Logged In)
- **Header:** Logo, user welcome message ("Welcome, [username]!"), role badge (green for admin, sage for player)
- **Navigation:** Horizontal bar with all main links
- **Main Content:** Grid of quiz cards (3-4 per row on desktop, 1-2 on mobile)
- **Quiz Card:** Title (large), category badge (color-coded: Action=red, Comedy=yellow, Horror=purple, Animated=blue, Superhero=orange), difficulty indicator (Easy=green, Medium=yellow, Hard=red), question count, Start Quiz button (green)
- **Filters:** Category dropdown, Difficulty dropdown, Search bar
- **Design:** Green cards with sage green accents, rounded corners (12px), subtle shadows, warm cream background

#### 9.1.3 Quiz Page
- **Header:** Quiz title, progress indicator ("Question 1 of 10"), timer display (if enabled, turns red under 30 seconds)
- **Main Content:**
  - Movie poster image (if Feature 2 enabled, max 300px wide, centered above question, green border)
  - Question text (large, 24px, dark green)
  - 4 answer choices as large clickable buttons (full width on mobile, 2x2 grid on desktop)
  - Selected answer highlighted in green with checkmark
  - Unselected answers have sage green border
- **Navigation:** Previous button (left), Next button (right), both green
- **Submit Button:** Large green button at bottom, only visible when all questions answered
- **Design:** Clean white background for question area, green accents, large touch targets (minimum 48x48px)

#### 9.1.4 Results Page
- **Header:** "Quiz Complete!" with movie clapperboard icon
- **Main Content:**
  - Score display (large, 48px): "You scored 8/10!"
  - Percentage: "80.00%" (40px, green if >70%, yellow if 50-70%, red if <50%)
  - Correct/Incorrect count: "8 correct, 2 incorrect"
  - Time taken: "Completed in 4 minutes 23 seconds" (if tracked)
  - Performance summary: "Great job!" or "Keep practicing!" message
- **Buttons:** "Try Again" (green, restarts same quiz), "Back to Quizzes" (sage outline), "View History" (outline)
- **Design:** Celebratory green theme, confetti animation on perfect score (100%)

#### 9.1.5 My History Page
- **Header:** "My Quiz History" with film reel icon
- **Filters:** Category dropdown, Date range picker (start/end dates)
- **Sort:** Dropdown (Most Recent, Highest Score, Quiz Name A-Z)
- **Main Content:** Table with columns: Quiz Name, Category, Score (e.g., "8/10"), Percentage, Date
- **Table Design:** Clean with alternating row colors (white and light cream), green header, hover effect on rows
- **Empty State:** "You haven't taken any quizzes yet!" with link to quiz list

#### 9.1.6 Leaderboards Page
- **Header:** "Leaderboards" with trophy icon
- **Tabs:** Overall (active by default), Action, Comedy, Horror, Animated, Superhero
- **Overall Tab:** Table with Rank, Username, Total Completed Attempts
- **Per-Quiz Tab:** Table with Rank, Username, Highest Score, Number of Attempts
- **Design:** Gold/silver/bronze color coding for top 3 positions, green theme for rest, podium icons for top 3

#### 9.1.7 Admin: Create/Edit Quiz Page
- **Header:** "Create Quiz" or "Edit Quiz: [Title]" with movie director icon
- **Form Fields:**
  - Title (text input, required)
  - Description (textarea, optional, max 500 chars)
  - Category (dropdown: Action, Comedy, Horror, Animated, Superhero, required)
  - Difficulty (dropdown: Easy, Medium, Hard, default: Medium)
  - Time Limit (number input with "seconds" label, default: 0, Feature 1)
  - Is Published (checkbox, default: checked)
- **Buttons:** Save (green), Cancel (outline), [Delete (red) if editing]
- **Design:** Standard form layout, green primary buttons, clear labels, 20px spacing between fields

#### 9.1.8 Admin: Create/Edit Question Page
- **Header:** "Add Question to [Quiz Name]" or "Edit Question" with question mark icon
- **Form Fields:**
  - Question Text (textarea, required, 10-500 chars)
  - Choice 1-4 (text inputs, each required, 1-200 chars, labeled A, B, C, D)
  - Correct Answer (dropdown of the 4 choices, required)
  - Points (number input, default: 1, min: 1)
  - Movie Reference (text input, optional, "Which movie is this about?")
  - Image URL (text input, optional, "Movie poster image URL", Feature 2)
  - Position (number input, optional, auto-assigned if blank)
- **Buttons:** Save (green), Cancel (outline), [Delete (red) if editing]
- **Design:** Vertical form, clear labeling, green submit button, radio buttons for correct answer selection

#### 9.1.9 Admin: CSV Import Page
- **Header:** "Import Questions" with upload icon
- **Steps:** Visual step indicator: 1. Download Template, 2. Upload CSV, 3. Preview, 4. Import
- **Step 1:** Download Template button (downloads CSV with headers)
- **Step 2:** Upload area with file input and drag-and-drop zone (green border, "Drop CSV file here")
- **Step 3:** Preview section showing parsed data in table format, invalid rows highlighted in red with error messages
- **Step 4:** Import button (green, "Import [X] Valid Rows")
- **Buttons:** Preview, Import, Cancel
- **Design:** Step indicator at top, clear error messages in red, success messages in green

#### 9.1.10 Login/Register Pages
- **Header:** MyQuizApp logo with movie theme
- **Form:** Centered card (max width: 400px) with form fields
- **Login Form:**
  - Email or Username (text input)
  - Password (password input)
  - Remember me checkbox
  - Login button (green, full width)
  - Forgot password link (optional)
  - Don't have an account? Register link
- **Register Form:**
  - Username (text input, 3-50 chars)
  - Email (email input)
  - Password (password input, min 8 chars)
  - Confirm Password (password input, must match)
  - Register button (green, full width)
  - Already have an account? Login link
- **Design:** Clean card layout, green accent color, error messages in red below fields, success messages in green

### 9.2 Mobile Behavior
- All pages responsive, work on phone screens (min width: 320px)
- Quiz cards stack vertically on small screens (1 per row)
- Navigation collapses to hamburger menu (3 horizontal lines) on mobile
- Answer choices stack vertically, full width, large touch targets
- Timer and progress indicators move to top of screen, fixed position
- Tables scroll horizontally if too wide
- Form inputs take full width on mobile
- Buttons are large (minimum 44x44px tap target)

---

## 10. Leaderboard Rules

### 10.1 Definitions
- **Completed Attempt:** User has submitted all answers for a quiz. Must answer all questions to submit.
- **Total Completed Quiz Attempts:** Count of all completed attempts across all quizzes for a user.
- **Highest Score:** For a user and quiz combination, the maximum score achieved across all completed attempts.
- **Number of Completed Attempts:** For a user and quiz combination, the count of all completed attempts.
- **Unfinished Attempt:** User started but did not submit. NOT saved to database, NOT counted in any statistics.

### 10.2 Overall Leaderboard Rules
- **Ranking Criteria (in order):**
  1. Total completed quiz attempts (descending - more is better)
  2. Username alphabetically (ascending - A comes before B) [for tie-breaking]
- **Displayed Columns:** Rank, Username, Total Completed Attempts
- **Inclusion:** All registered users are shown, even with 0 attempts
- **Sorting:** Always sorted by ranking criteria, cannot be reordered by user
- **Example:** User A has 5 attempts, User B has 5 attempts, User C has 3 attempts. If A < B alphabetically, order is: A (rank 1), B (rank 2), C (rank 3)

### 10.3 Per-Quiz Leaderboard Rules
- **Ranking Criteria (in order):**
  1. Highest score achieved on this quiz (descending - higher is better)
  2. Number of completed attempts for this quiz (descending - more is better)
  3. Username alphabetically (ascending - A comes before B) [for tie-breaking]
- **Displayed Columns:** Rank, Username, Highest Score (e.g., "10/10"), Number of Attempts
- **Inclusion:** Only users who have at least one completed attempt for this quiz
- **Note:** Only the highest score per user per quiz is shown, regardless of when it was achieved
- **Example:** User X has scores [8, 10, 7] on Quiz 1 = shows 10, 3 attempts. User Y has scores [9, 9] = shows 9, 2 attempts. X ranks higher (10 > 9).

### 10.4 Retry Behavior
- Each retry creates a new attempt record in the database
- The per-quiz leaderboard shows only the highest score, not the most recent or average
- Previous attempts remain in user's history but don't affect leaderboard position unless they're the highest
- Users can retry the same quiz indefinitely
- Each retry is a fresh attempt - previous answers are NOT shown

### 10.5 Data Display Rules
- Scores displayed as: "8/10" (correct/total) or "8/12" if questions have different point values
- Percentages displayed as: "80.00%" (rounded to exactly 2 decimal places)
- Usernames displayed as-is (not email addresses, not user IDs)
- Dates displayed in local timezone, format: "MMM D, YYYY h:mm A" (e.g., "Oct 15, 2024 2:30 PM")
- Rank 1 highlighted in gold, Rank 2 in silver, Rank 3 in bronze on per-quiz leaderboards

---

## 11. Database Schema

### 11.1 Tables

#### 11.1.1 users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes:**
- Simplified to player/admin only (teacher = admin)
- First user automatically becomes admin via trigger

#### 11.1.2 quizzes
```sql
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Action', 'Comedy', 'Horror', 'Animated', 'Superhero')),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    difficulty VARCHAR(20) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    time_limit INTEGER DEFAULT 0, -- in seconds, 0 = no limit (Feature 1: Timer Challenge)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes:**
- Added difficulty for filtering
- Added time_limit for Timer Challenge feature
- Categories are fixed to the 5 movie themes

#### 11.1.3 questions
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    choices JSONB NOT NULL, -- Array of exactly 4 strings
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0 AND correct_answer_index <= 3),
    points INTEGER DEFAULT 1,
    position INTEGER NOT NULL,
    movie_reference VARCHAR(100), -- Which movie this question is about
    image_url VARCHAR(500), -- For Feature 2: Movie Poster Display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes:**
- choices must be an array of exactly 4 strings
- Added movie_reference for context
- Added image_url for Movie Poster Display feature

#### 11.1.4 attempts
```sql
CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_taken INTEGER -- in seconds, for Feature 1: Timer Challenge
);
```

**Notes:**
- time_taken is optional but used for Timer Challenge feature
- ON DELETE CASCADE: If quiz is deleted, all its attempts are also deleted

### 11.2 Indexes
```sql
-- For faster user lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- For quiz listings
CREATE INDEX idx_quizzes_owner ON quizzes(owner_id);
CREATE INDEX idx_quizzes_published ON quizzes(is_published);
CREATE INDEX idx_quizzes_category ON quizzes(category);
CREATE INDEX idx_quizzes_difficulty ON quizzes(difficulty);

-- For attempt queries
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX idx_attempts_completed ON attempts(completed_at);
CREATE INDEX idx_attempts_score ON attempts(score);

-- For leaderboards
CREATE INDEX idx_attempts_user_quiz ON attempts(user_id, quiz_id);
CREATE INDEX idx_attempts_quiz_user_score ON attempts(quiz_id, user_id, score DESC);

-- For questions
CREATE INDEX idx_questions_quiz ON questions(quiz_id);
```

**Notes:** Added indexes for category, difficulty, score for better filtering and leaderboard performance.

### 11.3 Triggers
```sql
-- Update updated_at on tables with updated_at column
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

-- Set first user as admin (only if no admins exist)
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM users WHERE role = 'admin') = 0 THEN
        NEW.role := 'admin';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_first_admin BEFORE INSERT ON users
    FOR EACH ROW WHEN (NEW.role = 'player')
    EXECUTE FUNCTION set_first_user_as_admin();
```

**Notes:**
- Added trigger to automatically make first user an admin
- This ensures there's always at least one admin

---

## 12. API Design

### 12.1 Base URL
- Development: `http://localhost:3000/api`
- Production: `/api`

### 12.2 Authentication Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/auth/register` | Register new user | No | - |
| POST | `/api/auth/login` | Login user | No | - |
| POST | `/api/auth/logout` | Logout user | Yes | All |
| GET | `/api/auth/me` | Get current user info | Yes | All |

### 12.3 Quiz Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/quizzes` | List all published quizzes | No | - |
| GET | `/api/quizzes/:id` | Get quiz details with questions | Yes | Player+ |
| GET | `/api/quizzes/all` | List all quizzes (including unpublished) | Yes | Admin |
| POST | `/api/quizzes` | Create new quiz | Yes | Admin |
| PUT | `/api/quizzes/:id` | Update quiz metadata | Yes | Admin |
| DELETE | `/api/quizzes/:id` | Delete quiz (and all its questions & attempts) | Yes | Admin |

### 12.4 Question Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/questions/quiz/:quizId` | Get all questions for a quiz | Yes | Player+ |
| POST | `/api/questions` | Create new question | Yes | Admin |
| PUT | `/api/questions/:id` | Update question | Yes | Admin |
| DELETE | `/api/questions/:id` | Delete question | Yes | Admin |

### 12.5 Attempt Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/attempts` | Submit quiz attempt | Yes | Player+ |
| GET | `/api/attempts/me` | Get current user's attempt history | Yes | Player+ |
| GET | `/api/attempts/quiz/:quizId` | Get attempts for a specific quiz | Yes | Admin |
| GET | `/api/attempts/user/:userId` | Get attempts for a specific user | Yes | Admin |

### 12.6 Leaderboard Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/leaderboard` | Overall leaderboard | Yes | Player+ |
| GET | `/api/leaderboard/quiz/:quizId` | Per-quiz leaderboard | Yes | Player+ |

### 12.7 CSV Import Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/import/template` | Download CSV template | Yes | Admin |
| POST | `/api/import/preview` | Preview CSV import | Yes | Admin |
| POST | `/api/import` | Import validated CSV | Yes | Admin |

### 12.8 Response Format

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

## 13. Security Requirements

### 13.1 Password Storage
- **NEVER** store plain text passwords
- Use **bcrypt** for password hashing
- Minimum 10 rounds of hashing
- Salt is automatically handled by bcrypt

### 13.2 Session Management
- Use **express-session** with secure configuration
- Session secret stored in environment variables (not in code)
- Cookies:
  - `httpOnly: true` (prevent XSS attacks)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'lax'`
  - `maxAge: 24 * 60 * 60 * 1000` (24 hours)

### 13.3 SQL Injection Prevention
- **ALWAYS** use parameterized queries with `pg`
- Never use string concatenation for SQL

**Example of parameterized query (GOOD):**
```javascript
const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
);
```

**Example of BAD (NEVER DO THIS):**
```javascript
const result = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
);
```

### 13.4 Input Validation
- Validate all user input on both client and server
- Use **express-validator** middleware
- Sanitize input to prevent XSS attacks
- Minimum lengths, maximum lengths, required fields

### 13.5 CSRF Protection
- Use **csurf** middleware or implement CSRF tokens
- Tokens included in forms and AJAX requests
- Verify tokens on all state-changing requests (POST, PUT, DELETE)

### 13.6 Rate Limiting
- Implement rate limiting on authentication endpoints
- Prevent brute force attacks
- Use **express-rate-limit**
- Example: Max 5 login attempts per minute per IP

### 13.7 CORS
- Configure CORS for API endpoints
- In development: allow all origins
- In production: restrict to specific domains

---

## 14. Development Phases

### Phase 1: Foundation (Week 1) - Theme: Green & Cozy
**Goal:** Set up project structure, database, basic authentication, and pre-load movie quizzes

#### Tasks:
- [ ] Initialize GitHub repository
- [ ] Set up Node.js/Express project with npm
- [ ] Configure PostgreSQL database on Replit
- [ ] Create database schema and tables (including movie categories)
- [ ] Implement user model and authentication
- [ ] Password hashing with bcrypt
- [ ] Session management with express-session
- [ ] Basic server routes (health check, etc.)
- [ ] Simple frontend login/register pages with green/cozy theme
- [ ] Connect to Replit database
- [ ] **Add:** First-user-becomes-admin logic (via trigger)
- [ ] **Add:** Pre-load 5 movie quizzes with 10+ questions each
- [ ] Apply green/cozy theme to all initial pages

#### Deliverables:
- Working project structure with green/cozy theme
- Database with all tables created
- User can register, login, logout
- First user becomes admin automatically
- 5 movie quizzes visible on home page
- Sessions persist across page refreshes

#### Success Criteria:
- [ ] `npm start` runs without errors
- [ ] Can register a new user
- [ ] First registered user is admin
- [ ] Can login and logout
- [ ] Password is hashed in database (not plain text)
- [ ] 5 movie quizzes visible on home page with categories
- [ ] Theme colors (green) are visible on all pages

---

### Phase 2: Core Quiz Functionality (Week 2) - Movie Quizzes
**Goal:** Implement quiz management and basic quiz taking

#### Tasks:
- [ ] Quiz model and CRUD operations
- [ ] Question model and CRUD operations
- [ ] 5 movie quizzes already created in Phase 1
- [ ] Quiz listing page (shows all published quizzes with movie categories)
- [ ] Quiz detail page (shows quiz info, category, difficulty)
- [ ] Quiz taking interface with green/cozy theme
- [ ] Score calculation (sum of points, percentage)
- [ ] Attempt recording in database
- [ ] Results page showing score, percentage, correct/incorrect
- [ ] Retry functionality (fresh attempt, no previous answers shown)
- [ ] **Add:** Quiz category filtering on listing page
- [ ] **Add:** Navigation between questions (Previous/Next)

#### Deliverables:
- 5 movie quizzes with 10+ questions each in database
- Users can select and take quizzes
- Scores are calculated and displayed
- Attempts are saved to database
- Quiz categories displayed and filterable

#### Success Criteria:
- [ ] Can view list of movie quizzes with categories
- [ ] Can filter quizzes by category
- [ ] Can start a quiz
- [ ] Can navigate between questions (Previous/Next)
- [ ] Can answer all questions and submit
- [ ] Score and percentage are calculated correctly
- [ ] Can retry the same quiz (new attempt)
- [ ] All attempts are saved with timestamps
- [ ] Previous answers NOT shown on retry

---

### Phase 3: User Features (Week 3) - History & Leaderboards
**Goal:** Implement user-specific features, leaderboards, and admin dashboard

#### Tasks:
- [ ] User profile page (shows username, role, join date)
- [ ] Attempt history page with filtering (by category, date) and sorting
- [ ] Overall leaderboard implementation (rank by total attempts, tie-break by username)
- [ ] Per-quiz leaderboard implementation (rank by highest score, then attempts, then username)
- [ ] Role-based access control (admin sees edit buttons)
- [ ] Admin dashboard (create quiz, manage questions, view all data)
- [ ] Question editor UI for admins
- [ ] Create/edit questions interface with movie reference field
- [ ] Assign questions to quizzes
- [ ] **Add:** Green/cozy theme applied to all new pages
- [ ] **Add:** Gold/silver/bronze highlighting for top 3 on leaderboards

#### Deliverables:
- Users can view their own history with filtering
- Leaderboards display correctly with proper tie-breaking
- Admins can create/edit questions
- Role-based UI (admins see edit buttons, players don't)
- All pages have green/cozy theme

#### Success Criteria:
- [ ] Can view own attempt history sorted by date
- [ ] Can filter history by category
- [ ] Can sort history by score, quiz name, date
- [ ] Overall leaderboard shows correct rankings with tie-breaking
- [ ] Per-quiz leaderboard shows highest score per user
- [ ] Top 3 users highlighted in gold/silver/bronze
- [ ] Admin can create a new quiz
- [ ] Admin can add questions to a quiz
- [ ] Player cannot access admin features
- [ ] All new pages match theme

---

### Phase 4: Advanced Features (Week 4) - Custom Features & CSV
**Goal:** Implement CSV import, Timer Challenge, and Movie Poster Display features

#### Tasks:
- [ ] CSV import template design (with movie question format)
- [ ] CSV preview endpoint
- [ ] CSV validation logic
- [ ] CSV import functionality
- [ ] Error handling for invalid CSV rows
- [ ] Feedback on import results
- [ ] UI for CSV upload with preview
- [ ] Preview validation errors before import
- [ ] **Custom Feature 1:** Timer Challenge - add time_limit to quizzes, timer display, auto-submit
- [ ] **Custom Feature 2:** Movie Poster Display - add image_url to questions, display images
- [ ] Bug fixes from previous phases
- [ ] Performance optimizations

#### Deliverables:
- CSV template for movie question import
- Admins can upload questions via CSV
- Invalid CSV rows are identified before import
- Import confirmation and error reporting
- **Custom Feature 1:** Timer Challenge working (quizzes can have time limits)
- **Custom Feature 2:** Movie Poster Display working (images show with questions)

#### Success Criteria:
- [ ] Can download CSV template
- [ ] Can upload valid CSV and import movie questions
- [ ] Invalid CSV rows are flagged with specific errors
- [ ] Can preview import before confirming
- [ ] Imported questions appear in correct quiz
- [ ] Timer Challenge: Can set time limit, timer displays and counts down, auto-submits at 0
- [ ] Timer turns red under 30 seconds
- [ ] Movie Poster Display: Images display with questions, resize properly
- [ ] Images have green border and max 300px width
- [ ] Both features work without breaking existing functionality

---

### Phase 5: Final Testing & Deployment (Week 5) - Green & Cozy Movie Quiz App
**Goal:** Final testing, polish, and deploy the complete movie quiz app

#### Tasks:
- [ ] Final QA testing of all features
- [ ] Test all 5 movie quizzes (Action, Comedy, Horror, Animated, Superhero)
- [ ] Test Timer Challenge feature on multiple quizzes
- [ ] Test Movie Poster Display feature with various image URLs
- [ ] Test leaderboards with multiple users (create test accounts)
- [ ] Test CSV import with valid and invalid files
- [ ] Test edge cases (empty quiz, single question, tie-breaking scenarios)
- [ ] Deploy to Replit Deployment
- [ ] Set up production database (separate from dev)
- [ ] Configure environment variables for production
- [ ] Final theme polish (ensure all pages have green/cozy design)
- [ ] Final documentation updates

#### Custom Features Implemented:
- [x] **Feature 1: Timer Challenge** - Optional time limits on quizzes
- [x] **Feature 2: Movie Poster Display** - Show movie posters with questions

#### Deliverables:
- All required features working
- Custom features (Timer Challenge, Movie Poster Display) working
- Green/cozy theme applied consistently across all pages
- App deployed to Replit Deployment
- Production database separate from development
- Final documentation complete

#### Success Criteria:
- [ ] All required features work in production
- [ ] Timer Challenge feature works correctly
- [ ] Movie Poster Display feature works correctly
- [ ] All 5 movie quizzes available and functional
- [ ] Green/cozy theme consistent across all pages
- [ ] App is deployed to Replit Deployment
- [ ] Production database is separate from development
- [ ] Leaderboards update correctly with multiple users
- [ ] CSV import works in production
- [ ] First user is admin, can create more admins
- [ ] All validation works (no SQL injection, XSS protection)

---

## 15. CSV Import Specification

### 15.1 Template Format

```csv
quiz_title,question_text,choice_1,choice_2,choice_3,choice_4,correct_answer,points,movie_reference,image_url
"Action Movie Trivia","Which actor played John McClane in Die Hard?","Arnold Schwarzenegger","Sylvester Stallone","Bruce Willis","Jason Statham","Bruce Willis",1,"Die Hard","https://example.com/diehard-poster.jpg"
"Action Movie Trivia","In The Matrix, what color pill does Neo take?","Red","Blue","Green","White","Red",1,"The Matrix","
```

### 15.2 CSV Structure

| Column | Required | Type | Description | Example |
|--------|----------|------|-------------|---------|
| quiz_title | Yes | String | Must match an existing quiz title exactly | "Action Movie Trivia" |
| question_text | Yes | String | The question text (10-500 chars) | "Who played John McClane?" |
| choice_1 | Yes | String | First answer choice (1-200 chars) | "Arnold Schwarzenegger" |
| choice_2 | Yes | String | Second answer choice | "Sylvester Stallone" |
| choice_3 | Yes | String | Third answer choice | "Bruce Willis" |
| choice_4 | Yes | String | Fourth answer choice | "Jason Statham" |
| correct_answer | Yes | String | Must exactly match one of choice_1-4 | "Bruce Willis" |
| points | No | Integer | Points for this question (default: 1) | 1 |
| movie_reference | No | String | Which movie this is about | "Die Hard" |
| image_url | No | String | Movie poster image URL | "https://.../poster.jpg" |

### 15.3 Validation Rules

#### Row-Level Validation:
- All required columns must be present (quiz_title, question_text, choice_1-4, correct_answer)
- quiz_title must match an existing quiz in the database
- question_text must be 10-500 characters
- Each choice must be 1-200 characters
- Exactly 4 choices must be provided (all non-empty)
- correct_answer must exactly match one of the 4 choices (case-sensitive)
- points must be a positive integer (default: 1) if provided
- movie_reference is optional, max 100 characters
- image_url is optional, max 500 characters, must be valid URL format

#### File-Level Validation:
- File must be valid CSV (comma-separated values)
- File size limit: 5MB
- Maximum rows: 1000 (excluding header)
- First row must be header row with correct column names
- File extension must be .csv

### 15.4 Error Handling

For each invalid row, report:
- Row number (1-indexed, excluding header)
- Column with error
- Error type and human-readable message

**Example error response:**
```json
{
    "success": false,
    "errors": [
        {
            "row": 3,
            "column": "question_text",
            "message": "Question text must be at least 10 characters long (got 5)"
        },
        {
            "row": 5,
            "column": "correct_answer",
            "message": "Correct answer 'Batman' does not match any of the provided choices"
        },
        {
            "row": 7,
            "column": "quiz_title",
            "message": "Quiz 'Sci-Fi' not found in database"
        }
    ],
    "validRows": 8,
    "invalidRows": 3,
    "totalRows": 11
}
```

### 15.5 Import Process

1. **Download Template:** User clicks "Download Template" to get CSV with headers
2. **Prepare CSV:** User fills in questions using spreadsheet software
3. **Upload:** User uploads CSV file via drag-and-drop or file picker
4. **Preview:** Server validates file and returns:
   - List of valid rows (will be imported)
   - List of invalid rows with specific errors
   - Summary counts
5. **Review:** User reviews preview, fixes errors in CSV if needed
6. **Confirm:** User clicks "Import" to confirm
7. **Import:** Server imports all valid rows
8. **Summary:** Server returns import summary with counts

**Example success response:**
```json
{
    "success": true,
    "imported": 15,
    "skipped": 2,
    "message": "Successfully imported 15 questions, skipped 2 invalid rows"
}
```

---

## 16. File Structure

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
│   │   └── style.css        # Main stylesheet with green/cozy theme
│   ├── js/
│   │   ├── app.js           # Main application JS
│   │   ├── auth.js          # Authentication logic
│   │   ├── quizzes.js       # Quiz-related logic
│   │   ├── questions.js     # Question management
│   │   ├── attempts.js      # Attempt tracking
│   │   ├── leaderboard.js   # Leaderboard logic
│   │   ├── timer.js         # Timer Challenge feature (Feature 1)
│   │   └── api.js           # API client
│   └── index.html           # Main HTML entry point
│
├── src/                      # Server code
│   ├── app.js               # Express application setup
│   ├── server.js            # Server entry point
│   ├── config/
│   │   ├── db.js            # Database connection with pg
│   │   └── passport.js      # Authentication config (if using passport)
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
│   │   ├── auth.js          # Authentication middleware (checks role)
│   │   ├── validation.js    # Input validation middleware
│   │   └── errorHandler.js  # Error handling middleware
│   ├── utils/
│   │   ├── helpers.js       # Helper functions
│   │   ├── csvParser.js     # CSV parsing utilities
│   │   └── leaderboard.js   # Leaderboard calculation functions
│   └── migrations/          # Database migrations
│       └── init.sql         # Initial schema (this document's Section 11)
│
├── views/                   # Optional: Server-side templates (if needed)
│   └── partials/            # HTML partials
│
└── docs/                    # Additional documentation
    └── ...
```

---

## Final Notes

### What's Ready to Build
This specification document contains **everything** needed to build the MyQuizApp:
- ✅ Theme and design decisions (green and cozy, movie topics)
- ✅ All required features from the assignment
- ✅ 2 custom features (Timer Challenge, Movie Poster Display)
- ✅ 5 movie quizzes with 12 questions each (exceeds 10 minimum)
- ✅ Complete database schema with all tables and indexes
- ✅ Full API design with all endpoints
- ✅ Security requirements
- ✅ 5 development phases with clear tasks and success criteria
- ✅ User experience and navigation design
- ✅ Page design details for all major pages
- ✅ Leaderboard rules with tie-breaking
- ✅ CSV import specification
- ✅ File structure

### Next Steps
1. **Review this document** one final time
2. **Approve all decisions** (theme, features, quiz content)
3. **Start Phase 1** - Set up project structure and pre-load movie quizzes
4. **The AI can now build** without any guesswork!

---

*Document Status: Final - Ready for Implementation*  
*Last Updated: October 2024*  
*Theme: Green and Cozy Movie Quiz App*  
*Custom Features: Timer Challenge + Movie Poster Display*
