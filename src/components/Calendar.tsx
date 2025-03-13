import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface CalendarProps {
  tasks: Task[];
  onDateClick?: (date: Date) => void;
}

export function Calendar({ tasks, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get tasks with deadlines
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.deadline) {
      const date = format(new Date(task.deadline), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-accent rounded-md"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm hover:bg-accent rounded-md"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-accent rounded-md"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}

        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const tasksForDate = tasksByDate[dateKey] || [];
          const isSelected = isSameDay(currentDate, day);
          
          return (
            <button
              key={day.toString()}
              onClick={() => {
                setCurrentDate(day);
                onDateClick?.(day);
              }}
              className={cn(
                "relative h-12 text-sm p-1 border rounded-md transition-colors",
                !isSameMonth(day, currentDate) && "text-muted-foreground",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isToday(day) && "border-primary",
                !isSelected && "hover:bg-accent"
              )}
            >
              <span className="absolute top-1 left-1">
                {format(day, 'd')}
              </span>
              {tasksForDate.length > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 right-1 flex items-center justify-center w-5 h-5 text-xs rounded-full",
                    isSelected
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {tasksForDate.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}