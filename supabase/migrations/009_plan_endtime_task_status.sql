-- Add end_time and end_date to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS end_date DATE;

-- Migrate any in_progress tasks to new (removing in_progress status)
UPDATE tasks SET status = 'new' WHERE status = 'in_progress';
