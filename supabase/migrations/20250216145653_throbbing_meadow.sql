/*
  # Fix Category Management

  1. Changes
    - Add better error handling for user context
    - Add validation for category operations
    - Improve function security

  2. Security
    - Ensure user context is properly validated
    - Add proper error messages
    - Improve function security with SECURITY DEFINER
*/

-- Improve the manage_category function with better validation and error handling
CREATE OR REPLACE FUNCTION manage_category(p_name text)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
  v_user_id uuid;
BEGIN
  -- Get and validate the user context
  v_user_id := NULLIF(current_setting('app.user_id', true), '')::uuid;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User context not set';
  END IF;

  -- Validate the category name
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Category name cannot be empty';
  END IF;

  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM categories
  WHERE name = trim(p_name)
    AND user_id = v_user_id;

  -- Create new category if it doesn't exist
  IF v_category_id IS NULL THEN
    INSERT INTO categories (name, user_id)
    VALUES (trim(p_name), v_user_id)
    RETURNING id INTO v_category_id;
  END IF;

  RETURN v_category_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error managing category: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improve the delete_category function with better error handling
CREATE OR REPLACE FUNCTION delete_category(p_category_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get and validate the user context
  v_user_id := NULLIF(current_setting('app.user_id', true), '')::uuid;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User context not set';
  END IF;

  -- Validate the category exists and belongs to the user
  IF NOT EXISTS (
    SELECT 1 
    FROM categories 
    WHERE id = p_category_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Category not found or does not belong to the user';
  END IF;

  -- Check if the category has tasks
  IF EXISTS (
    SELECT 1 
    FROM tasks 
    WHERE category_id = p_category_id
  ) THEN
    RETURN false;
  END IF;

  -- Delete the category
  DELETE FROM categories
  WHERE id = p_category_id
    AND user_id = v_user_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting category: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_user_id ON categories(name, user_id);

-- Update RLS policy to be more explicit
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );