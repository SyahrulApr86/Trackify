-- Improve the manage_category function with better user context handling
CREATE OR REPLACE FUNCTION manage_category(p_name text)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the current user ID from the context
  BEGIN
    v_user_id := current_setting('app.user_id', true)::uuid;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE EXCEPTION 'User context not set or invalid';
  END;

  -- Validate the user ID
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User context not set';
  END IF;

  -- Validate the category name
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Category name cannot be empty';
  END IF;

  -- Try to find existing category with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      SELECT id INTO v_category_id
      FROM categories
      WHERE name = trim(p_name)
        AND user_id = v_user_id;
      
      EXIT WHEN v_category_id IS NOT NULL;

      -- If category doesn't exist, create it
      IF v_category_id IS NULL THEN
        INSERT INTO categories (name, user_id)
        VALUES (trim(p_name), v_user_id)
        RETURNING id INTO v_category_id;
        
        EXIT;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        IF i = 3 THEN
          RAISE EXCEPTION 'Failed to manage category after 3 attempts: %', SQLERRM;
        END IF;
        -- Wait a bit before retrying
        PERFORM pg_sleep(0.1);
    END;
  END LOOP;

  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add better error handling to the set_user_context function
CREATE OR REPLACE FUNCTION set_user_context(user_id uuid)
RETURNS void AS $$
BEGIN
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Set the context with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      PERFORM set_config('app.user_id', user_id::text, false);
      
      -- Verify the context was set correctly
      IF current_setting('app.user_id', true)::uuid = user_id THEN
        RETURN;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        IF i = 3 THEN
          RAISE EXCEPTION 'Failed to set user context after 3 attempts: %', SQLERRM;
        END IF;
        -- Wait a bit before retrying
        PERFORM pg_sleep(0.1);
    END;
  END LOOP;

  RAISE EXCEPTION 'Failed to verify user context was set correctly';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;