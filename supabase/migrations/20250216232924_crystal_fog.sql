/*
  # Add Time Progress Feature

  1. New Tables
    - `time_progress`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `time_progress` table
    - Add policy for authenticated users to manage their own progress items
*/

-- Create time_progress table
CREATE TABLE time_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  -- Add check constraint to ensure end_date is after start_date
  CONSTRAINT time_progress_dates_check CHECK (end_date >= start_date)
);

-- Enable Row Level Security
ALTER TABLE time_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for managing own progress items
CREATE POLICY "Users can manage own progress items"
  ON time_progress
  FOR ALL
  TO authenticated
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- Create indexes for better performance
CREATE INDEX idx_time_progress_user_id ON time_progress(user_id);
CREATE INDEX idx_time_progress_dates ON time_progress(start_date, end_date);