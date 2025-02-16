export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskCategory = string;

export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  category_id?: string;
  category?: string;
  status: TaskStatus;
  column_id: string;
  order: number;
  user_id: string;
  created_at: string;
  completed_at?: string;
  archived_at?: string;
  tags?: Tag[];
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}