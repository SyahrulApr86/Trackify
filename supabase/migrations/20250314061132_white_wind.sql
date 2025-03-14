/*
  # Add color column to categories table

  1. Changes
    - Add `color` column to categories table
    - Add check constraint to ensure valid colors
    - Update existing categories to have default colors

  2. Notes
    - Color column is optional
    - Default to null (will use default color scheme)
*/

-- Add color column to categories table
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS color text;

-- Add check constraint for valid colors
ALTER TABLE categories
  ADD CONSTRAINT categories_color_check CHECK (
    color IS NULL OR color IN (
      'slate', 'gray', 'zinc', 'neutral', 'stone',
      'red', 'orange', 'amber', 'yellow', 'lime',
      'green', 'emerald', 'teal', 'cyan', 'sky',
      'blue', 'indigo', 'violet', 'purple',
      'fuchsia', 'pink', 'rose'
    )
  );

-- Set default colors for existing predefined categories
UPDATE categories SET color = 'blue' WHERE name = 'Work';
UPDATE categories SET color = 'green' WHERE name = 'Personal';
UPDATE categories SET color = 'red' WHERE name = 'Urgent';
UPDATE categories SET color = 'purple' WHERE name = 'Study';
UPDATE categories SET color = 'orange' WHERE name = 'Shopping';
UPDATE categories SET color = 'teal' WHERE name = 'Health';
UPDATE categories SET color = 'emerald' WHERE name = 'Finance';
UPDATE categories SET color = 'indigo' WHERE name = 'Travel';
UPDATE categories SET color = 'amber' WHERE name = 'Home';