-- LISTED App Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT,
  parent_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_order INTEGER NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  label_order INTEGER NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 4 CHECK (priority >= 1 AND priority <= 4),
  due_date DATE,
  due_time TIME,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  task_order INTEGER NOT NULL DEFAULT 0,
  duration INTEGER, -- minutes
  recurrence JSONB, -- RecurrenceRule as JSON
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task-Label junction table
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  UNIQUE(task_id, label_id)
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'absolute',
  relative_minutes INTEGER,
  notification_id TEXT,
  triggered BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_labels_owner ON labels(owner_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_owner ON reminders(owner_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Tasks policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = owner_id);

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- Labels policies
CREATE POLICY "Users can view own labels"
  ON labels FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own labels"
  ON labels FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own labels"
  ON labels FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own labels"
  ON labels FOR DELETE
  USING (auth.uid() = owner_id);

-- Task_labels policies (based on task ownership)
CREATE POLICY "Users can view own task_labels"
  ON task_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own task_labels"
  ON task_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own task_labels"
  ON task_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.owner_id = auth.uid()
    )
  );

-- Reminders policies
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = owner_id);
