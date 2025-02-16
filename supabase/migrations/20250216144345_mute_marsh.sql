-- Update the manage_category function to properly handle user context
CREATE OR REPLACE FUNCTION manage_category(p_name text)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the current user ID
  v_user_id := current_setting('app.user_id', true)::uuid;
  
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM categories
  WHERE name = p_name
    AND user_id = v_user_id;

  -- Create new category if it doesn't exist
  IF v_category_id IS NULL THEN
    INSERT INTO categories (name, user_id)
    VALUES (p_name, v_user_id)
    RETURNING id INTO v_category_id;
  END IF;

  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- Ensure categories table has proper indexes
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