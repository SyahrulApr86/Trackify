import React from 'react';
import { Trash2, Flag } from 'lucide-react';
import { Button } from '../ui/button';
import { Task, getCategoryColors } from '@/types/task';

interface StaticTaskCardProps {
  task: Task & { categoryColor?: string };
  onDelete: (task: Task) => void;
  onClick: (task: Task) => void;
}

function getPriorityStyles(priority: number) {
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
      return 'bg-gray-100 text-gray-700';
  }
}

export function StaticTaskCard({ task, onDelete, onClick }: StaticTaskCardProps) {
  const categoryColors = getCategoryColors(task.category, task.categoryColor);

  return (
    <div
      className="bg-background border rounded-lg p-3 shadow-sm group kanban-task cursor-pointer hover:shadow-md"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <p className="font-medium break-words">{task.title}</p>
              {task.priority < 99999 && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityStyles(task.priority)}`}>
                  <Flag className="w-3 h-3" />
                  P{task.priority}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground break-words">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {task.category && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                {task.category}
              </span>
            )}
            {task.deadline && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}