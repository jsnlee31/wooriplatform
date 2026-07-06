const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const pool = new Pool(connectionString ? {
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
} : {
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'asiangames_platform',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

let schemaReady;

const ensureCoreSchema = async () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id VARCHAR(20) UNIQUE,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name_ko VARCHAR(100) NOT NULL,
          name_en VARCHAR(100),
          role VARCHAR(50) DEFAULT 'learner',
          status VARCHAR(50) DEFAULT 'active',
          phone VARCHAR(20),
          department VARCHAR(100),
          position VARCHAR(100),
          retirement_date DATE,
          profile_image VARCHAR(500),
          oauth_provider VARCHAR(50),
          oauth_id VARCHAR(255),
          preferred_language VARCHAR(10) DEFAULT 'ko',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP WITH TIME ZONE
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title_ko VARCHAR(200) NOT NULL,
          title_en VARCHAR(200),
          description_ko TEXT,
          description_en TEXT,
          category VARCHAR(100),
          type VARCHAR(50) DEFAULT 'video',
          duration_minutes INTEGER,
          thumbnail_url VARCHAR(500),
          video_url VARCHAR(500),
          document_url VARCHAR(500),
          file_size VARCHAR(20),
          view_count INTEGER DEFAULT 0,
          download_count INTEGER DEFAULT 0,
          is_featured BOOLEAN DEFAULT FALSE,
          instructor_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES users(id)');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS course_enrollments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
          progress_percent INTEGER DEFAULT 0,
          is_completed BOOLEAN DEFAULT FALSE,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE,
          last_accessed_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(user_id, course_id)
        )
      `);
    })();
  }
  return schemaReady;
};

module.exports = {
  query: async (text, params) => {
    await ensureCoreSchema();
    return pool.query(text, params);
  },
  ensureCoreSchema,
  pool
};
