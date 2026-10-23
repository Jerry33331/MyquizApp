/**
 * Database Initialization Script
 * Creates tables, triggers, and pre-loads 5 movie quizzes with questions
 * Run with: npm run init-db
 */

const { pool, query } = require('../config/db');

// SQL for creating tables
const createTables = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Action', 'Comedy', 'Horror', 'Animated', 'Superhero')),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    difficulty VARCHAR(20) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    time_limit INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    choices JSONB NOT NULL,
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0 AND correct_answer_index <= 3),
    points INTEGER DEFAULT 1,
    position INTEGER NOT NULL,
    movie_reference VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_taken INTEGER
);
`;

// SQL for indexes
const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON quizzes(difficulty);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_completed ON attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
`;

// SQL for triggers
const createTriggers = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM users WHERE role = 'admin') = 0 THEN
        NEW.role := 'admin';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS check_first_admin ON users;
CREATE TRIGGER check_first_admin 
    BEFORE INSERT ON users
    FOR EACH ROW WHEN (NEW.role = 'player')
    EXECUTE FUNCTION set_first_user_as_admin();
`;

// Movie quiz data - 5 quizzes with 12 questions each
const movieQuizzes = [
  {
    title: 'Action Movie Trivia',
    description: 'Test your knowledge of action movies, iconic scenes, and actors',
    category: 'Action',
    difficulty: 'Medium',
    time_limit: 0,
    questions: [
      { question_text: 'Which actor played John McClane in the Die Hard series?', choices: ['Arnold Schwarzenegger', 'Sylvester Stallone', 'Bruce Willis', 'Jason Statham'], correct_answer_index: 2, points: 1, position: 1, movie_reference: 'Die Hard' },
      { question_text: 'In The Matrix, what color pill does Neo take?', choices: ['Red', 'Blue', 'Green', 'White'], correct_answer_index: 0, points: 1, position: 2, movie_reference: 'The Matrix' },
      { question_text: 'What is the name of the villain in The Dark Knight?', choices: ['Bane', 'Scarecrow', 'The Joker', 'Two-Face'], correct_answer_index: 2, points: 1, position: 3, movie_reference: 'The Dark Knight' },
      { question_text: 'Which movie features the line "I\'ll be back"?', choices: ['Rambo', 'Terminator 2', 'Predator', 'Commando'], correct_answer_index: 1, points: 1, position: 4, movie_reference: 'Terminator 2' },
      { question_text: 'What type of martial arts is Keanu Reeves known for in John Wick?', choices: ['Karate', 'Jiu-Jitsu', 'Kung Fu', 'Judo'], correct_answer_index: 1, points: 1, position: 5, movie_reference: 'John Wick' },
      { question_text: 'In Mission: Impossible, what is Ethan Hunt\'s profession?', choices: ['Detective', 'Spy', 'Soldier', 'Hacker'], correct_answer_index: 1, points: 1, position: 6, movie_reference: 'Mission: Impossible' },
      { question_text: 'Which action movie features a character named Dutch?', choices: ['Die Hard', 'Predator', 'The Terminator', 'Lethal Weapon'], correct_answer_index: 1, points: 1, position: 7, movie_reference: 'Predator' },
      { question_text: 'What is the name of the main character in the Mad Max series?', choices: ['Max Rockatansky', 'Max Payne', 'Max Steel', 'Max Damage'], correct_answer_index: 0, points: 1, position: 8, movie_reference: 'Mad Max' },
      { question_text: 'In Fast & Furious, what is Dominic Toretto\'s nickname?', choices: ['Dom', 'D', 'Big D', 'Toretto'], correct_answer_index: 0, points: 1, position: 9, movie_reference: 'Fast & Furious' },
      { question_text: 'Which of these is NOT a James Bond actor?', choices: ['Sean Connery', 'Roger Moore', 'Tom Cruise', 'Pierce Brosnan'], correct_answer_index: 2, points: 1, position: 10, movie_reference: 'James Bond' },
      { question_text: 'What is the weapon of choice for John Wick?', choices: ['Sniper Rifle', 'Shotgun', 'Pencil', 'Handgun'], correct_answer_index: 2, points: 1, position: 11, movie_reference: 'John Wick' },
      { question_text: 'In the movie 300, what is the name of the battle?', choices: ['Battle of Troy', 'Battle of Thermopylae', 'Battle of Sparta', 'Battle of Athens'], correct_answer_index: 1, points: 1, position: 12, movie_reference: '300' }
    ]
  },
  {
    title: 'Comedy Movie Quotes',
    description: 'Identify movies from their famous comedy quotes',
    category: 'Comedy',
    difficulty: 'Medium',
    time_limit: 0,
    questions: [
      { question_text: '"Here\'s looking at you, kid." is from which movie?', choices: ['Casablanca', 'The Hangover', 'Airplane', 'Dumb and Dumber'], correct_answer_index: 0, points: 1, position: 1, movie_reference: 'Casablanca' },
      { question_text: 'Which movie has the quote "You can\'t handle the truth!"?', choices: ['Liar Liar', 'A Few Good Men', 'The Big Lebowski', 'Forrest Gump'], correct_answer_index: 1, points: 1, position: 2, movie_reference: 'A Few Good Men' },
      { question_text: '"Life is like a box of chocolates" is from which film?', choices: ['The Shawshank Redemption', 'Forrest Gump', 'Big', 'Jerry Maguire'], correct_answer_index: 1, points: 1, position: 3, movie_reference: 'Forrest Gump' },
      { question_text: '"I\'m king of the world!" was yelled by Leonardo DiCaprio in which movie?', choices: ['The Wolf of Wall Street', 'Inception', 'Titanic', 'The Revenant'], correct_answer_index: 2, points: 1, position: 4, movie_reference: 'Titanic' },
      { question_text: 'Which comedy features the line "Nobody puts Baby in a corner"?', choices: ['Dirty Dancing', 'Ferris Bueller\'s Day Off', 'The Princess Bride', 'Clueless'], correct_answer_index: 0, points: 1, position: 5, movie_reference: 'Dirty Dancing' },
      { question_text: '"To infinity and beyond!" is the catchphrase of which character?', choices: ['Shrek', 'Buzz Lightyear', 'Woody', 'Mickey Mouse'], correct_answer_index: 1, points: 1, position: 6, movie_reference: 'Toy Story' },
      { question_text: '"I\'ll have what she\'s having" is from which romantic comedy?', choices: ['When Harry Met Sally', 'Sleepless in Seattle', 'You\'ve Got Mail', 'Notting Hill'], correct_answer_index: 0, points: 1, position: 7, movie_reference: 'When Harry Met Sally' },
      { question_text: 'Which movie: "You had me at hello"?', choices: ['The Notebook', 'Jerry Maguire', 'Sleepless in Seattle', 'Pretty Woman'], correct_answer_index: 1, points: 1, position: 8, movie_reference: 'Jerry Maguire' },
      { question_text: '"Wax on, wax off" is a famous line from which 80s movie?', choices: ['The Karate Kid', 'Back to the Future', 'Ghostbusters', 'Ferris Bueller\'s Day Off'], correct_answer_index: 0, points: 1, position: 9, movie_reference: 'The Karate Kid' },
      { question_text: '"I\'m not bad, I\'m just drawn that way" was said by which character?', choices: ['Jessica Rabbit', 'Betty Boop', 'Minnie Mouse', 'Daisy Duck'], correct_answer_index: 0, points: 1, position: 10, movie_reference: 'Who Framed Roger Rabbit' },
      { question_text: 'Which movie: "Show me the money!"?', choices: ['Wall Street', 'The Wolf of Wall Street', 'Jerry Maguire', 'Moneyball'], correct_answer_index: 2, points: 1, position: 11, movie_reference: 'Jerry Maguire' },
      { question_text: '"Why so serious?" is a quote from which movie?', choices: ['The Joker (The Dark Knight)', 'Batman Begins', 'Superman', 'Spider-Man'], correct_answer_index: 0, points: 1, position: 12, movie_reference: 'The Dark Knight' }
    ]
  },
  {
    title: 'Horror Movie Knowledge',
    description: 'Test your knowledge of horror movies, directors, and facts',
    category: 'Horror',
    difficulty: 'Hard',
    time_limit: 0,
    questions: [
      { question_text: 'Which director is known as the "Master of Horror"?', choices: ['Steven Spielberg', 'Wes Craven', 'Alfred Hitchcock', 'Stanley Kubrick'], correct_answer_index: 2, points: 1, position: 1, movie_reference: 'Various' },
      { question_text: 'In The Exorcist, what is the name of the possessed girl?', choices: ['Regan', 'Emily', 'Sarah', 'Linda'], correct_answer_index: 0, points: 1, position: 2, movie_reference: 'The Exorcist' },
      { question_text: 'Which horror movie features the line "Here\'s Johnny!"?', choices: ['The Shining', 'Poltergeist', 'A Nightmare on Elm Street', 'Halloween'], correct_answer_index: 0, points: 1, position: 3, movie_reference: 'The Shining' },
      { question_text: 'What is the name of the killer in the Scream movies?', choices: ['Ghostface', 'Michael Myers', 'Jason Voorhees', 'Freddy Krueger'], correct_answer_index: 0, points: 1, position: 4, movie_reference: 'Scream' },
      { question_text: 'In A Nightmare on Elm Street, where does Freddy Krueger attack?', choices: ['In dreams', 'In the shower', 'In the woods', 'In the basement'], correct_answer_index: 0, points: 1, position: 5, movie_reference: 'A Nightmare on Elm Street' },
      { question_text: 'Which horror franchise features a character named Jigsaw?', choices: ['Saw', 'Paranormal Activity', 'The Conjuring', 'Insidious'], correct_answer_index: 0, points: 1, position: 6, movie_reference: 'Saw' },
      { question_text: 'What is the name of the hotel in The Shining?', choices: ['The Overlook Hotel', 'The Stanley Hotel', 'The Haunted Hotel', 'The Mountain View Hotel'], correct_answer_index: 0, points: 1, position: 7, movie_reference: 'The Shining' },
      { question_text: 'In Halloween, what is Michael Myers\' weapon of choice?', choices: ['Axe', 'Chainsaw', 'Knife', 'Machete'], correct_answer_index: 2, points: 1, position: 8, movie_reference: 'Halloween' },
      { question_text: 'Which of these is NOT a Stephen King novel adaptation?', choices: ['It', 'The Exorcist', 'Pet Sematary', 'The Shining'], correct_answer_index: 1, points: 1, position: 9, movie_reference: 'Various' },
      { question_text: 'What year was the original Psycho released?', choices: ['1958', '1960', '1962', '1965'], correct_answer_index: 1, points: 1, position: 10, movie_reference: 'Psycho' },
      { question_text: 'In The Conjuring, what are the names of the demonologists?', choices: ['Ed and Lorraine Warren', 'Sam and Dean Winchester', 'Peter and Ray Stantz', 'Dana and Zuul'], correct_answer_index: 0, points: 1, position: 11, movie_reference: 'The Conjuring' },
      { question_text: 'Which horror movie features a clown named Pennywise?', choices: ['It', 'The Ring', 'Poltergeist', 'Child\'s Play'], correct_answer_index: 0, points: 1, position: 12, movie_reference: 'It' }
    ]
  },
  {
    title: 'Animated Movie Magic',
    description: 'Questions about Disney, Pixar, DreamWorks and other animated films',
    category: 'Animated',
    difficulty: 'Easy',
    time_limit: 0,
    questions: [
      { question_text: 'Which company produced Toy Story?', choices: ['DreamWorks', 'Pixar', 'Disney', 'Universal'], correct_answer_index: 1, points: 1, position: 1, movie_reference: 'Toy Story' },
      { question_text: 'What is the name of Simba\'s father in The Lion King?', choices: ['Scar', 'Mufasa', 'Timon', 'Rafiki'], correct_answer_index: 1, points: 1, position: 2, movie_reference: 'The Lion King' },
      { question_text: 'In Finding Nemo, what kind of fish is Nemo?', choices: ['Shark', 'Clownfish', 'Goldfish', 'Angel fish'], correct_answer_index: 1, points: 1, position: 3, movie_reference: 'Finding Nemo' },
      { question_text: 'Which Disney princess has a raccoon as a sidekick?', choices: ['Pocahontas', 'Belle', 'Ariel', 'Jasmine'], correct_answer_index: 0, points: 1, position: 4, movie_reference: 'Pocahontas' },
      { question_text: 'What is the name of the boy in The Jungle Book?', choices: ['Mowgli', 'Baloo', 'Shere Khan', 'Akela'], correct_answer_index: 0, points: 1, position: 5, movie_reference: 'The Jungle Book' },
      { question_text: 'In Shrek, what does Shrek turn into at the end?', choices: ['Prince', 'Human', 'Ogre', 'Dragon'], correct_answer_index: 1, points: 1, position: 6, movie_reference: 'Shrek' },
      { question_text: 'Which movie features the song "Let It Go"?', choices: ['Tangled', 'Brave', 'Moana', 'Frozen'], correct_answer_index: 3, points: 1, position: 7, movie_reference: 'Frozen' },
      { question_text: 'What is the name of the robot in WALL-E?', choices: ['EVE', 'WALL-E', 'MAR-Y', 'Both A and B'], correct_answer_index: 3, points: 1, position: 8, movie_reference: 'WALL-E' },
      { question_text: 'In Despicable Me, what are the little yellow characters called?', choices: ['Minions', 'Henchmen', 'Sidekicks', 'Helpers'], correct_answer_index: 0, points: 1, position: 9, movie_reference: 'Despicable Me' },
      { question_text: 'Which Disney movie features a magic carpet?', choices: ['Aladdin', 'Beauty and the Beast', 'Cinderella', 'Sleeping Beauty'], correct_answer_index: 0, points: 1, position: 10, movie_reference: 'Aladdin' },
      { question_text: 'What is the name of the villain in The Little Mermaid?', choices: ['Maleficent', 'Ursula', 'Cruella', 'Jafar'], correct_answer_index: 1, points: 1, position: 11, movie_reference: 'The Little Mermaid' },
      { question_text: 'In Inside Out, what are the main characters?', choices: ['Emotions', 'Toys', 'Animals', 'Superheroes'], correct_answer_index: 0, points: 1, position: 12, movie_reference: 'Inside Out' }
    ]
  },
  {
    title: 'Superhero Movie Universe',
    description: 'Questions about Marvel, DC, and other superhero movies',
    category: 'Superhero',
    difficulty: 'Medium',
    time_limit: 0,
    questions: [
      { question_text: 'Who plays Iron Man in the Marvel Cinematic Universe?', choices: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'], correct_answer_index: 1, points: 1, position: 1, movie_reference: 'Iron Man' },
      { question_text: 'What is the name of Thor\'s hammer?', choices: ['Vanir', 'Asgard', 'Mjolnir', 'Odin'], correct_answer_index: 2, points: 1, position: 2, movie_reference: 'Thor' },
      { question_text: 'In The Avengers, what is the name of the team\'s headquarters?', choices: ['Avengers Tower', 'Stark Tower', 'Avengers Mansion', 'Shield HQ'], correct_answer_index: 0, points: 1, position: 3, movie_reference: 'The Avengers' },
      { question_text: 'Which superhero says "I am Groot"?', choices: ['Rocket', 'Star-Lord', 'Groot', 'Drax'], correct_answer_index: 2, points: 1, position: 4, movie_reference: 'Guardians of the Galaxy' },
      { question_text: 'What is the real name of Spider-Man?', choices: ['Peter Parker', 'Tony Stark', 'Steve Rogers', 'Bruce Wayne'], correct_answer_index: 0, points: 1, position: 5, movie_reference: 'Spider-Man' },
      { question_text: 'In the Dark Knight trilogy, who plays Batman?', choices: ['Val Kilmer', 'George Clooney', 'Michael Keaton', 'Christian Bale'], correct_answer_index: 3, points: 1, position: 6, movie_reference: 'The Dark Knight' },
      { question_text: 'What is the name of Captain America\'s shield made of?', choices: ['Steel', 'Vibranium', 'Adamantium', 'Titanium'], correct_answer_index: 1, points: 1, position: 7, movie_reference: 'Captain America' },
      { question_text: 'Which superhero can shrink to the size of an ant?', choices: ['Ant-Man', 'The Wasp', 'Both A and B', 'Neither'], correct_answer_index: 2, points: 1, position: 8, movie_reference: 'Ant-Man' },
      { question_text: 'In Black Panther, what is the name of the country?', choices: ['Wakanda', 'Zamunda', 'Genovia', 'Latveria'], correct_answer_index: 0, points: 1, position: 9, movie_reference: 'Black Panther' },
      { question_text: 'What is the name of the villain in Spider-Man: Homecoming?', choices: ['Green Goblin', 'Doctor Octopus', 'Vulture', 'Venom'], correct_answer_index: 2, points: 1, position: 10, movie_reference: 'Spider-Man: Homecoming' },
      { question_text: 'Which superhero is known as the "Scarlet Speedster"?', choices: ['The Flash', 'Quicksilver', 'Speedy', 'Zoom'], correct_answer_index: 0, points: 1, position: 11, movie_reference: 'The Flash' },
      { question_text: 'In Guardians of the Galaxy, what is the name of the talking raccoon?', choices: ['Rocket', 'Star-Lord', 'Groot', 'Drax'], correct_answer_index: 0, points: 1, position: 12, movie_reference: 'Guardians of the Galaxy' }
    ]
  }
];

async function initializeDatabase() {
  console.log('Starting database initialization...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('Transaction started\n');
    
    console.log('Creating tables...');
    await client.query(createTables);
    console.log('✓ Tables created\n');
    
    console.log('Creating indexes...');
    await client.query(createIndexes);
    console.log('✓ Indexes created\n');
    
    console.log('Creating triggers...');
    await client.query(createTriggers);
    console.log('✓ Triggers created\n');
    
    // Check if quizzes already exist
    const { rows } = await client.query('SELECT COUNT(*) FROM quizzes');
    const quizCount = parseInt(rows[0].count, 10);
    
    if (quizCount === 0) {
      console.log('Inserting 5 movie quizzes with 12 questions each...\n');
      
      for (const quizData of movieQuizzes) {
        // Insert quiz
        const quizResult = await client.query(
          `INSERT INTO quizzes (title, description, category, difficulty, time_limit, is_published) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [quizData.title, quizData.description, quizData.category, quizData.difficulty, quizData.time_limit, true]
        );
        const quizId = quizResult.rows[0].id;
        console.log(`  ✓ Created quiz: ${quizData.title} (ID: ${quizId})`);
        
        // Insert questions for this quiz
        for (const questionData of quizData.questions) {
          await client.query(
            `INSERT INTO questions (quiz_id, question_text, choices, correct_answer_index, points, position, movie_reference, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              quizId,
              questionData.question_text,
              JSON.stringify(questionData.choices),
              questionData.correct_answer_index,
              questionData.points,
              questionData.position,
              questionData.movie_reference,
              questionData.image_url || ''
            ]
          );
        }
        console.log(`  ✓ Added ${quizData.questions.length} questions`);
      }
      
      console.log('\n✓ Successfully inserted 5 movie quizzes with 12 questions each!\n');
    } else {
      console.log(`ℹ Database already has ${quizCount} quizzes. Skipping quiz insertion.\n`);
    }
    
    await client.query('COMMIT');
    console.log('✓ Database initialization complete!\n');
    
    // Verify
    const { rows: quizRows } = await client.query('SELECT COUNT(*) FROM quizzes');
    const { rows: questionRows } = await client.query('SELECT COUNT(*) FROM questions');
    
    console.log('Database Summary:');
    console.log(`  - Quizzes: ${quizRows[0].count}`);
    console.log(`  - Questions: ${questionRows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('='.repeat(50));
console.log('MyQuizApp Database Initialization');
console.log('='.repeat(50));
console.log();

initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
