import { column, Schema, Table } from '@powersync/react-native';

// Tasks table - synced with Supabase
const tasks = new Table(
  {
    // PowerSync auto-creates 'id' column
    title: column.text,
    description: column.text,
    priority: column.integer,
    due_date: column.text,
    due_time: column.text,
    completed: column.integer,
    completed_at: column.text,
    project_id: column.text,
    parent_id: column.text,
    task_order: column.integer,
    duration: column.integer,
    recurrence: column.text, // JSON string
    created_at: column.text,
    updated_at: column.text,
    owner_id: column.text, // user id for sync
  },
  { indexes: { project: ['project_id'], parent: ['parent_id'], due: ['due_date'] } },
);

// Projects table
const projects = new Table(
  {
    name: column.text,
    color: column.text,
    icon: column.text,
    parent_id: column.text,
    project_order: column.integer,
    created_at: column.text,
    updated_at: column.text,
    owner_id: column.text,
  },
  { indexes: { parent: ['parent_id'] } },
);

// Labels table
const labels = new Table(
  {
    name: column.text,
    color: column.text,
    label_order: column.integer,
    owner_id: column.text,
  },
  { indexes: {} },
);

// Task-Label junction table
const task_labels = new Table(
  {
    task_id: column.text,
    label_id: column.text,
  },
  { indexes: { task: ['task_id'], label: ['label_id'] } },
);

// Reminders table
const reminders = new Table(
  {
    task_id: column.text,
    reminder_time: column.text,
    reminder_type: column.text,
    relative_minutes: column.integer,
    notification_id: column.text,
    triggered: column.integer,
    created_at: column.text,
    owner_id: column.text,
  },
  { indexes: { task: ['task_id'] } },
);

export const PowerSyncSchema = new Schema({
  tasks,
  projects,
  labels,
  task_labels,
  reminders,
});

export type Database = (typeof PowerSyncSchema)['types'];
export type TaskRecord = Database['tasks'];
export type ProjectRecord = Database['projects'];
export type LabelRecord = Database['labels'];
export type TaskLabelRecord = Database['task_labels'];
export type ReminderRecord = Database['reminders'];
