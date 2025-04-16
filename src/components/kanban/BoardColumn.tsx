import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { TaskCard } from './TaskCard';
import { Column, Task, Category } from '@/types/task';
import { AddTaskDialog } from './AddTaskDialog';

interface BoardColumnProps {
  column: Column;
  addingTaskToColumn: string | null;
  onAddTask: (columnId: string) => void;
  onCancelAdd: () => void;
  onDeleteTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  categories: Category[];
}

export function BoardColumn({
  column,
  addingTaskToColumn,
  onAddTask,
  onCancelAdd,
  onDeleteTask,
  onTaskClick,
  categories
}: BoardColumnProps) {
  // Helper function to get category color
  const getCategoryColorByName = (categoryName: string): string | undefined => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color;
  };

  // Add category colors to tasks
  const tasksWithColors = column.tasks.map(task => ({
    ...task,
    categoryColor: getCategoryColorByName(task.category || '')
  }));

  return (
    <div className="bg-card rounded-lg border shadow-sm h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{column.title}</h3>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-4 space-y-3 flex-1 min-h-[200px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-accent/50' : ''
            }`}
          >
            {tasksWithColors.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={onDeleteTask}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      
      {addingTaskToColumn === column.id ? (
        <AddTaskDialog
          columnId={column.id}
          onAdd={async (columnId: string) => {
            onAddTask(columnId);
            return Promise.resolve();
          }}
          onCancel={onCancelAdd}
          categories={categories}
        />
      ) : (
        <Button
          onClick={() => onAddTask(column.id)}
          variant="ghost"
          className="w-full flex items-center gap-1 text-muted-foreground hover:text-foreground p-4 group rounded-none rounded-b-lg"
        >
          <Plus size={16} className="transition-transform group-hover:scale-125" />
          Add a task
        </Button>
      )}
    </div>
  );
}