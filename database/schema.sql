-- notion-lite PostgreSQL Schema
-- Phase 1: auth, dashboard, notes, tasks

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  username    VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  avatar_url  VARCHAR(500),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PAGES (note containers)
-- ─────────────────────────────────────────
CREATE TABLE pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL DEFAULT 'Untitled',
  icon        VARCHAR(10),
  cover_url   VARCHAR(500),
  parent_id   UUID REFERENCES pages(id) ON DELETE SET NULL,
  is_deleted  BOOLEAN DEFAULT FALSE,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- BLOCKS (Notion-style block architecture)
-- ─────────────────────────────────────────
CREATE TYPE block_type AS ENUM (
  'text', 'heading1', 'heading2', 'heading3',
  'checklist', 'bulleted_list', 'numbered_list',
  'code', 'image', 'divider', 'quote', 'table',
  'callout', 'toggle'
);

CREATE TABLE blocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id         UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  parent_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  type            block_type NOT NULL DEFAULT 'text',
  content         JSONB NOT NULL DEFAULT '{}',
  position        FLOAT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────────
CREATE TABLE tags (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    VARCHAR(100) NOT NULL,
  color   VARCHAR(20) DEFAULT '#6366f1',
  UNIQUE(user_id, name)
);

CREATE TABLE page_tags (
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);

-- ─────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'done', 'cancelled');

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  priority    task_priority DEFAULT 'medium',
  status      task_status DEFAULT 'todo',
  due_date    DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- HABITS (Phase 2)
-- ─────────────────────────────────────────
CREATE TABLE habits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  frequency   VARCHAR(20) DEFAULT 'daily',
  streak      INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id    UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  completed   BOOLEAN DEFAULT TRUE,
  UNIQUE(habit_id, logged_date)
);

-- ─────────────────────────────────────────
-- JOURNAL (Phase 2)
-- ─────────────────────────────────────────
CREATE TABLE journal_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(500),
  content    TEXT,
  mood       VARCHAR(50),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- ─────────────────────────────────────────
-- LEARNING PROGRESS (Phase 3)
-- ─────────────────────────────────────────
CREATE TABLE learning_topics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100),
  progress    SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  notes       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- STOCKS (Phase 3)
-- ─────────────────────────────────────────
CREATE TABLE stock_watchlist (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol    VARCHAR(20) NOT NULL,
  name      VARCHAR(255),
  added_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_pages_user_id     ON pages(user_id);
CREATE INDEX idx_blocks_page_id    ON blocks(page_id);
CREATE INDEX idx_blocks_position   ON blocks(page_id, position);
CREATE INDEX idx_tasks_user_id     ON tasks(user_id);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_due_date    ON tasks(due_date);
CREATE INDEX idx_habits_user_id    ON habits(user_id);
CREATE INDEX idx_habit_logs_date   ON habit_logs(logged_date);
