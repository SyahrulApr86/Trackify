/*
  # Fix users table id generation

  1. Changes
    - Update users table id column to use gen_random_uuid() instead of auth.uid()
    - Add INSERT policy for users table
*/

-- Update the default value for the id column
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add INSERT policy for users table
DROP POLICY IF EXISTS "Users can insert" ON users;
CREATE POLICY "Users can insert"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policy for users table
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (id = current_setting('app.user_id', true)::uuid);