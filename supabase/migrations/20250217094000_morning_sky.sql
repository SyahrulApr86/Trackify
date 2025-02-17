/*
  # Add Task Priority Field

  1. Changes
    - Add priority integer column to tasks table
    - Add check constraint to ensure priority >= 1
    - Set default priority to 99999 (lowest priority)
  
  2. Constraints
    - Priority must be >= 1
    - Default value ensures new tasks don't interfere with existing priorities
*/

-- Add priority column with check constraint
ALTER TABLE tasks
  ADD COLUMN priority integer NOT NULL DEFAULT 99999,
  ADD CONSTRAINT tasks_priority_check CHECK (priority >= 1);