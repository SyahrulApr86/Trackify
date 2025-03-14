import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Task, Category, getCategoryColors } from '@/types/task';
import { cn } from '@/lib/utils';

interface CalendarProps {
  tasks: Task[];
  categories?: Category[]; // Add categories prop
  onDateClick?: (date: Date) => void;
}

export function Calendar({ tasks, categories = [], onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper function to get category color from the categories list
  const getCategoryColorByName = (categoryName: string): string | undefined => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color;
  };

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

  // Get unique categories for a specific date
  const getUniqueCategoriesForDate = (tasks: Task[]) => {
    const uniqueCategories = new Set<string>();
    tasks.forEach(task => {
      if (task.category) {
        uniqueCategories.add(task.category);
      }
    });
    return Array.from(uniqueCategories).slice(0, 3); // Limit to 3 for space
  };

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
          const uniqueCategories = getUniqueCategoriesForDate(tasksForDate);
          
          return (
            <button
              key={day.toString()}
              onClick={() => {
                setCurrentDate(day);
                onDateClick?.(day);
              }}
              className={cn(
                "relative h-14 text-sm p-1 border rounded-md transition-colors", // Increased height for category dots
                !isSameMonth(day, currentDate) && "text-muted-foreground",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isToday(day) && "border-primary",
                !isSelected && "hover:bg-accent"
              )}
            >
              <span className="absolute top-1 left-1">
                {format(day, 'd')}
              </span>
              
              {/* Category indicators */}
              {uniqueCategories.length > 0 && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {uniqueCategories.map(category => {
                    const categoryColor = getCategoryColorByName(category);
                    const colors = getCategoryColors(category, categoryColor);
                    const bgClass = colors.bg.replace('bg-', '');
                    
                    return (
                      <div 
                        key={category}
                        className={`w-2 h-2 rounded-full bg-${bgClass}`}
                        title={category}
                      />
                    );
                  })}
                  {tasksForDate.length > uniqueCategories.length && (
                    <div className="w-2 h-2 rounded-full bg-gray-300" title="More categories" />
                  )}
                </div>
              )}
              
              {/* Task count */}
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