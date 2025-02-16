/*
  # Add tags support
  
  1. New Tables
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text, unique per user)
      - `user_id` (uuid, references users)
      - `created_at` (timestamptz)
    - `task_tags`
      - `task_id` (uuid, references tasks)
      - `tag_id` (uuid, references tags)
      - `created_at` (timestamptz)
  
  2. Functions
    - `manage_tag`: Creates or retrieves a tag by name
    - `add_task_tags`: Adds multiple tags to a task
    - `remove_task_tags`: Removes tags from a task
  
  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create tags table
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Create task_tags junction table
CREATE TABLE task_tags (
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (task_id, tag_id)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY "Users can manage own task tags"
  ON task_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = current_setting('app.user_id', true)::uuid
    )
  );

-- Create function to manage tags
CREATE OR REPLACE FUNCTION manage_tag(p_name text)
RETURNS uuid AS $$
DECLARE
  v_tag_id uuid;
  v_user_id uuid;
BEGIN
  -- Get and validate the user context
  v_user_id := NULLIF(current_setting('app.user_id', true), '')::uuid;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User context not set';
  END IF;

  -- Validate the tag name
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Tag name cannot be empty';
  END IF;

  -- Try to find existing tag
  SELECT id INTO v_tag_id
  FROM tags
  WHERE name = trim(p_name)
    AND user_id = v_user_id;

  -- Create new tag if it doesn't exist
  IF v_tag_id IS NULL THEN
    INSERT INTO tags (name, user_id)
    VALUES (trim(p_name), v_user_id)
    RETURNING id INTO v_tag_id;
  END IF;

  RETURN v_tag_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error managing tag: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add tags to a task
CREATE OR REPLACE FUNCTION add_task_tags(p_task_id uuid, p_tag_names text[])
RETURNS void AS $$
DECLARE
  v_tag_id uuid;
  v_tag_name text;
BEGIN
  -- For each tag name
  FOREACH v_tag_name IN ARRAY p_tag_names
  LOOP
    -- Get or create the tag
    v_tag_id := manage_tag(v_tag_name);
    
    -- Add the tag to the task
    INSERT INTO task_tags (task_id, tag_id)
    VALUES (p_task_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove tags from a task
CREATE OR REPLACE FUNCTION remove_task_tags(p_task_id uuid, p_tag_ids uuid[])
RETURNS void AS $$
BEGIN
  DELETE FROM task_tags
  WHERE task_id = p_task_id
    AND tag_id = ANY(p_tag_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name_user_id ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);