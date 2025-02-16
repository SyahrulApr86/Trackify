/*
  # Add daily notes feature

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `date` (date)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `notes` table
    - Add policy for authenticated users to manage their own notes
*/

-- Create notes table
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  date date NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_note_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_note_timestamp
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_note_timestamp();

-- Create indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_date ON notes(date);
CREATE INDEX idx_notes_user_id_date ON notes(user_id, date);