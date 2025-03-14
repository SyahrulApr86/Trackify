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