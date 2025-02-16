export interface Note {
  id: string;
  title: string;
  content: string | null;
  date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}