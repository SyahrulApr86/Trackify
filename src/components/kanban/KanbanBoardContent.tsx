import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from './BoardColumn';
import { CategoryView } from '../CategoryView';
import { TaskTable } from '../TaskTable';
import { Board, Category, Task } from '@/types/task';

interface KanbanBoardContentProps {
  viewMode: 'kanban' | 'table' | 'categories';
  filteredBoard: Board;
  filteredTasks: Task[];
  addingTaskToColumn: string | null;
  onAddTask: (columnId: string) => void;
  onCancelAdd: () => void;
  onDeleteTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  categories: Category[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onBulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  onAddTaskToCategory: (category: string) => void;
  onCategoriesChange: (categories: Category[]) => void;
  onDragEnd: (result: DropResult) => void;
}

export function KanbanBoardContent({
  viewMode,
  filteredBoard,
  filteredTasks,
  addingTaskToColumn,
  onAddTask,
  onCancelAdd,
  onDeleteTask,
  onTaskClick,
  categories,
  onUpdateTask,
  onBulkUpdateTasks,
  onAddTaskToCategory,
  onCategoriesChange,
  onDragEnd
}: KanbanBoardContentProps) {
  if (viewMode === 'kanban') {
    return (
      <div className="space-y-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoard.columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                addingTaskToColumn={addingTaskToColumn}
                onAddTask={onAddTask}
                onCancelAdd={onCancelAdd}
                onDeleteTask={onDeleteTask}
                onTaskClick={onTaskClick}
                categories={categories}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    );
  }

  if (viewMode === 'categories') {
    return (
      <CategoryView
        tasks={filteredTasks}
        categories={categories}
        onDeleteTask={onDeleteTask}
        onTaskClick={onTaskClick}
        onAddTask={onAddTaskToCategory}
        onCategoriesChange={onCategoriesChange}
      />
    );
  }

  return (
    <TaskTable
      tasks={filteredTasks}
      onUpdateTask={onUpdateTask}
      onDeleteTask={(taskId) => {
        const task = filteredTasks.find(t => t.id === taskId);
        if (task) {
          onDeleteTask(task);
        }
        return Promise.resolve();
      }}
      onBulkUpdateTasks={onBulkUpdateTasks}
      categories={categories}
    />
  );
}