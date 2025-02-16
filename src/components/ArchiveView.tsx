import React from 'react';
import { format, parseISO } from 'date-fns';
import { Archive, Calendar, Clock } from 'lucide-react';
import { Task } from '@/types/task';
import { Button } from './ui/button';

interface ArchiveViewProps {
  tasks: Task[];
  onUnarchive: (taskId: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

export function ArchiveView({ tasks, onUnarchive, onTaskClick }: ArchiveViewProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.archived_at || !b.archived_at) return 0;
    return new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime();
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Archive className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No archived tasks</h3>
        <p className="text-muted-foreground">
          Tasks that have been completed for more than 7 days will automatically appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <div
          key={task.id}
          className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{task.title}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnarchive(task.id);
                  }}
                >
                  Restore
                </Button>
              </div>
              
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {task.category && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${task.category === 'Urgent' ? 'bg-red-100 text-red-700' :
                      task.category === 'Work' ? 'bg-blue-100 text-blue-700' :
                      task.category === 'Personal' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'}`}>
                    {task.category}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Completed
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.completed_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}
                  </div>
                )}
                {task.archived_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Archived {format(new Date(task.archived_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}