/*
  # Add authentication columns to users table

  1. Changes
    - Add to `users` table:
      - `username` (text, unique)
      - `display_name` (text)
      - `password_hash` (text)

  2. Functions
    - Add user context functions for RLS
*/

-- Add new columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN display_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Create functions for user context
CREATE OR REPLACE FUNCTION set_user_context(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_id', null, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use user context
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS "Users can manage own boards" ON boards;
CREATE POLICY "Users can manage own boards"
  ON boards
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS "Users can manage columns in their boards" ON columns;
CREATE POLICY "Users can manage columns in their boards"
  ON columns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid);