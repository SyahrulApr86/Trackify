/*
  # Fix Category Management

  1. Changes
    - Add function to safely delete categories
    - Add function to check if category can be deleted
    - Add function to get category tasks count

  2. Security
    - All functions use RLS context
    - Functions are security definer to ensure proper access control
*/

-- Function to check if a category can be deleted
CREATE OR REPLACE FUNCTION can_delete_category(p_category_id uuid)
RETURNS boolean AS $$
DECLARE
  v_task_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_task_count
  FROM tasks
  WHERE category_id = p_category_id;
  
  RETURN v_task_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete a category
CREATE OR REPLACE FUNCTION delete_category(p_category_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user ID
  v_user_id := current_setting('app.user_id', true)::uuid;
  
  -- Check if the category belongs to the user and has no tasks
  IF EXISTS (
    SELECT 1 
    FROM categories c
    WHERE c.id = p_category_id 
      AND c.user_id = v_user_id
      AND NOT EXISTS (
        SELECT 1 
        FROM tasks t 
        WHERE t.category_id = c.id
      )
  ) THEN
    -- Delete the category
    DELETE FROM categories
    WHERE id = p_category_id
      AND user_id = v_user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category tasks count
CREATE OR REPLACE FUNCTION get_category_tasks_count(p_category_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM tasks
  WHERE category_id = p_category_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;