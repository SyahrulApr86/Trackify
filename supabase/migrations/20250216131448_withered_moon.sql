/*
  # Enhance tasks table with additional fields

  1. Changes
    - Add new columns to tasks table:
      - `description` (text, optional)
      - `deadline` (timestamptz, optional)
      - `category` (text, optional)
      - `status` (text, not null)

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to tasks table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'description'
  ) THEN
    ALTER TABLE tasks ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deadline timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'category'
  ) THEN
    ALTER TABLE tasks ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status text NOT NULL DEFAULT 'To Do';
  END IF;
END $$;