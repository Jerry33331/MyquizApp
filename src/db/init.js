/**
 * Database Initialization Script
 * Creates tables, triggers, and first admin user logic
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
    choices JSONB NOT NULL CHECK (jsonb_typeof(choices) = 'array' AND array_length(choices, 1) = 4),
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
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quiz_id);
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

async function initializeDatabase() {
  console.log('Starting database initialization...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create tables
    console.log('Creating tables...');
    await client.query(createTables);
    console.log('✓ Tables created\n');
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query(createIndexes);
    console.log('✓ Indexes created\n');
    
    // Create triggers
    console.log('Creating triggers...');
    await client.query(createTriggers);
    console.log('✓ Triggers created\n');
    
    await client.query('COMMIT');
    console.log('✓ Database initialization complete!\n');
    
    // Verify
    const { rows } = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('Tables created:', rows.map(r => r.table_name).join(', '));
    
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
