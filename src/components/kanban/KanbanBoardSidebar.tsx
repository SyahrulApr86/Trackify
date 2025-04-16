import { Calendar } from '../Calendar';
import { TimeProgressBar } from '../TimeProgressBar';
import { Task } from '@/types/task';

interface KanbanBoardSidebarProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
}

export function KanbanBoardSidebar({ tasks, onDateClick }: KanbanBoardSidebarProps) {
  return (
    <div className="space-y-6">
      <Calendar tasks={tasks} onDateClick={onDateClick} />
      <TimeProgressBar />
    </div>
  );
}