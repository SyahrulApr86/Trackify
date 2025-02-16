/*
  # Add tag cleanup functionality

  1. New Functions
    - `cleanup_unused_tags`: Removes tags that have no associated tasks
    - `cleanup_tags_trigger`: Trigger function to automatically clean up tags when tasks are removed

  2. Changes
    - Add trigger on task_tags table to automatically clean up unused tags
*/

-- Create function to clean up unused tags
CREATE OR REPLACE FUNCTION cleanup_unused_tags()
RETURNS void AS $$
BEGIN
  -- Delete tags that have no associated tasks
  DELETE FROM tags
  WHERE NOT EXISTS (
    SELECT 1
    FROM task_tags
    WHERE task_tags.tag_id = tags.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for tag cleanup
CREATE OR REPLACE FUNCTION cleanup_tags_trigger()
RETURNS trigger AS $$
BEGIN
  -- Clean up unused tags after task_tags changes
  PERFORM cleanup_unused_tags();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on task_tags table
DROP TRIGGER IF EXISTS trigger_cleanup_tags ON task_tags;
CREATE TRIGGER trigger_cleanup_tags
  AFTER DELETE ON task_tags
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_tags_trigger();