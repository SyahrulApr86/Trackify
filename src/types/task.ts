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
  categoryColor?: string;
  status: TaskStatus;
  column_id: string;
  order: number;
  user_id: string;
  created_at: string;
  completed_at?: string;
  archived_at?: string;
  tags?: Tag[];
  priority: number;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  color?: string;
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

// Available color options for categories
export const availableColors = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose'
] as const;

export type CategoryColor = typeof availableColors[number];

export function getCategoryColors(categoryName: string | undefined | null, customColor?: string): { bg: string; text: string } {
  // If a custom color is provided and it's valid, use it
  if (customColor && availableColors.includes(customColor as CategoryColor)) {
    return {
      bg: `bg-${customColor}-100`,
      text: `text-${customColor}-700`
    };
  }

  // Default color if no custom color is provided
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-700'
  };
}