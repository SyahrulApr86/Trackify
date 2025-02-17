export interface TimeProgress {
  id: string;
  title: string;
  start_date: string;
  start_hour: number;
  start_minute: number;
  end_date: string;
  end_hour: number;
  end_minute: number;
  user_id: string;
  created_at: string;
}

export interface TimeProgressWithProgress extends TimeProgress {
  progress: number;
  daysRemaining: number;
}