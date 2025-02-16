/*
  # Initial Schema for Trackify

  1. New Tables
    - `users` - Stores user information
      - `id` (uuid, primary key) - User's unique identifier
      - `email` (text) - User's email address
      - `created_at` (timestamp) - When the user was created
    
    - `boards` - Stores Kanban boards
      - `id` (uuid, primary key) - Board's unique identifier
      - `title` (text) - Board's title
      - `user_id` (uuid) - Owner of the board
      - `created_at` (timestamp) - When the board was created
    
    - `columns` - Stores board columns
      - `id` (uuid, primary key) - Column's unique identifier
      - `title` (text) - Column's title
      - `board_id` (uuid) - Board this column belongs to
      - `order` (integer) - Column's order in the board
      - `created_at` (timestamp) - When the column was created
    
    - `tasks` - Stores tasks
      - `id` (uuid, primary key) - Task's unique identifier
      - `title` (text) - Task's title
      - `description` (text) - Task's description
      - `column_id` (uuid) - Column this task belongs to
      - `order` (integer) - Task's order in the column
      - `is_completed` (boolean) - Whether the task is completed
      - `created_at` (timestamp) - When the task was created
      - `user_id` (uuid) - Owner of the task

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create tables
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  column_id uuid REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  "order" integer NOT NULL,
  is_completed boolean DEFAULT false,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own boards"
  ON boards
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage columns in their boards"
  ON columns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);