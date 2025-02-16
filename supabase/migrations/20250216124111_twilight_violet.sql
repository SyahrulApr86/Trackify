/*
  # Remove email requirement from users table

  1. Changes
    - Make email column nullable
    - Drop NOT NULL constraint from email column
    - Add NOT NULL constraints to username, display_name, and password_hash
*/

-- Make email column nullable and add required constraints to other columns
ALTER TABLE users 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN display_name SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL;