-- Improve the manage_category function with better error handling
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a trigger to ensure user_id is never null
CREATE OR REPLACE FUNCTION check_category_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_category_user_id
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION check_category_user_id();

-- Ensure the RLS policy is properly set
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

-- Add better indexing for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id_name ON categories(user_id, name);