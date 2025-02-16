/*
  # Add categories table and update task management

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `user_id` (uuid, references users)
      - `created_at` (timestamp)
      - Unique constraint on (name, user_id)

  2. Changes
    - Add `category_id` to tasks table
    - Add function to manage categories
    - Add RLS policies for categories

  3. Security
    - Enable RLS on categories table
    - Add policy for users to manage their own categories
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- Add category_id to tasks
ALTER TABLE tasks
  ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Create function to manage categories
CREATE OR REPLACE FUNCTION manage_category(p_name text)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM categories
  WHERE name = p_name
    AND user_id = current_setting('app.user_id', true)::uuid;

  -- Create new category if it doesn't exist
  IF v_category_id IS NULL THEN
    INSERT INTO categories (name, user_id)
    VALUES (p_name, current_setting('app.user_id', true)::uuid)
    RETURNING id INTO v_category_id;
  END IF;

  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to migrate existing categories
CREATE OR REPLACE FUNCTION migrate_existing_categories()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  -- Process each unique category and user_id combination
  FOR r IN (
    SELECT DISTINCT category, user_id
    FROM tasks
    WHERE category IS NOT NULL
  ) LOOP
    -- Create category if it doesn't exist
    INSERT INTO categories (name, user_id)
    VALUES (r.category, r.user_id)
    ON CONFLICT (name, user_id) DO NOTHING;
  END LOOP;

  -- Update tasks with category_id
  UPDATE tasks t
  SET category_id = c.id
  FROM categories c
  WHERE t.category = c.name
    AND t.user_id = c.user_id
    AND t.category IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_existing_categories();