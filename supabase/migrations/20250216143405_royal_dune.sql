/*
  # Remove category column from tasks table

  1. Changes
    - Remove the `category` column from tasks table since we now use `category_id`
*/

-- Remove the category column from tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS category;