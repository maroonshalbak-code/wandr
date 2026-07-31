-- Add end_time to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS end_time TIME;

-- Migrate any in_progress tasks to new (removing in_progress status)
UPDATE tasks SET status = 'new' WHERE status = 'in_progress';
