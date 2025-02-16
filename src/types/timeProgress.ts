export interface TimeProgress {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
}

export interface TimeProgressWithProgress extends TimeProgress {
  progress: number;
  daysRemaining: number;
}