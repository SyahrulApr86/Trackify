import React from 'react';
import { AlertCircle, Clock, Flag } from 'lucide-react';
import { Task, Category } from '@/types/task';
import { format, isPast, isToday, addDays } from 'date-fns';
import { getCategoryColors } from '@/types/task';

interface DeadlineReminderProps {
  tasks: Task[];
  categories?: Category[]; // Add categories prop
  onTaskClick: (task: Task) => void;
}

export function DeadlineReminder({ tasks, categories = [], onTaskClick }: DeadlineReminderProps) {
  const incompleteTasks = tasks.filter(
      task =>
          task.deadline &&
          (task.status === 'To Do' || task.status === 'In Progress') &&
          !task.archived_at
  );

  const overdueTasks = incompleteTasks.filter(
      task => task.deadline && isPast(new Date(task.deadline))
  );

  const todayTasks = incompleteTasks.filter(
      task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return isToday(deadline) && !isPast(deadline);
      }
  );

  const upcomingTasks = incompleteTasks.filter(
      task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return !isPast(deadline) && !isToday(deadline) && deadline <= addDays(new Date(), 7);
      }
  );

  // Helper function to get category color from the categories list
  const getCategoryColorByName = (categoryName: string): string | undefined => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color;
  };

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

  const getPriorityStyles = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-700';
      case 2:
        return 'bg-orange-100 text-orange-700';
      case 3:
        return 'bg-yellow-100 text-yellow-700';
      case 4:
        return 'bg-blue-100 text-blue-700';
      case 5:
        return 'bg-green-100 text-green-700';
      default:
        return '';
    }
  };

  // Ensure each task appears only in one section
  const processedTaskIds = new Set<string>();

  const renderTaskGrid = (tasks: Task[], title: string, icon: React.ReactNode, containerClass: string, cardClass: string) => {
    if (tasks.length === 0) return null;

    return (
        <div className={containerClass}>
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h3 className="font-semibold">{title}</h3>
            <span className="text-sm text-muted-foreground">({tasks.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tasks.map(task => {
              if (processedTaskIds.has(task.id)) return null;
              processedTaskIds.add(task.id);

              // Get the category color from the categories list
              const categoryColor = getCategoryColorByName(task.category || '');
              const categoryColors = getCategoryColors(task.category, categoryColor);

              return (
                  <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`text-left rounded-md p-3 transition-colors ${cardClass}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <p className="font-medium line-clamp-1">{task.title}</p>
                          {task.priority < 99999 && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityStyles(task.priority)}`}>
                          <Flag className="w-3 h-3" />
                          P{task.priority}
                        </span>
                          )}
                        </div>
                        <span className={`shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
                      {task.status}
                    </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {task.category && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                        {task.category}
                      </span>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Due {task.deadline && format(new Date(task.deadline), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </button>
              );
            })}
          </div>
        </div>
    );
  };

  return (
      <div className="space-y-6">
        {renderTaskGrid(
            overdueTasks,
            'Overdue Tasks',
            <AlertCircle className="w-5 h-5 text-destructive" />,
            "bg-red-200 border border-red-300 rounded-lg p-4",
            "bg-red-100 hover:bg-red-300 border border-red-200"
        )}

        {renderTaskGrid(
            todayTasks,
            'Due Today',
            <Clock className="w-5 h-5 text-yellow-600" />,
            "bg-yellow-100 border border-yellow-200 rounded-lg p-4",
            "bg-yellow-50 hover:bg-yellow-200 border border-yellow-200"
        )}

        {renderTaskGrid(
            upcomingTasks,
            'Upcoming Deadlines',
            <Clock className="w-5 h-5 text-blue-600" />,
            "bg-blue-100 border border-blue-200 rounded-lg p-4",
            "bg-blue-50 hover:bg-blue-200 border border-blue-200"
        )}
      </div>
  );
}