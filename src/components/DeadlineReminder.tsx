import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Task } from '@/types/task';
import { format, isPast, isToday, addDays } from 'date-fns';

interface DeadlineReminderProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function DeadlineReminder({ tasks, onTaskClick }: DeadlineReminderProps) {
  const incompleteTasks = tasks.filter(
    task => 
      task.deadline && 
      (task.status === 'To Do' || task.status === 'In Progress') &&
      !task.archived_at
  );

  const overdueTasks = incompleteTasks.filter(
    task => isPast(new Date(task.deadline))
  );

  const todayTasks = incompleteTasks.filter(
    task => {
      const deadline = new Date(task.deadline);
      return isToday(deadline) && !isPast(deadline);
    }
  );

  const upcomingTasks = incompleteTasks.filter(
    task => {
      const deadline = new Date(task.deadline);
      return !isPast(deadline) && !isToday(deadline) && deadline <= addDays(new Date(), 7);
    }
  );

  if (incompleteTasks.length === 0) return null;

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'To Do':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-2">
      {overdueTasks.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Overdue Tasks</h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full text-left bg-background/50 hover:bg-background/80 rounded-md p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due {format(new Date(task.deadline), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {todayTasks.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Due Today</h3>
          </div>
          <div className="space-y-2">
            {todayTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full text-left bg-background/50 hover:bg-background/80 rounded-md p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due {format(new Date(task.deadline), 'HH:mm')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {upcomingTasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full text-left bg-background/50 hover:bg-background/80 rounded-md p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due {format(new Date(task.deadline), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}