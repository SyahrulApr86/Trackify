import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { Category, Task } from '@/types/task';

interface KanbanBoardDialogsProps {
  taskToDelete: Task | null;
  onCancelDelete: () => void;
  onConfirmDelete: (taskId: string) => Promise<void>;
  addingTaskToColumn: string | null;
  selectedCategory: string | null;
  onAddTask: (columnId: string, taskData: Partial<Task>) => Promise<void>;
  onCancelAdd: () => void;
  categories: Category[];
  onCategoriesChange: () => Promise<void>;
  selectedTask: Task | null;
  selectedDateTasks: Task[] | null;
  onCloseTaskDetails: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onArchiveTask: (taskId: string) => Promise<void>;
  onTaskChange: (task: Task) => void;
}

export function KanbanBoardDialogs({
  taskToDelete,
  onCancelDelete,
  onConfirmDelete,
  addingTaskToColumn,
  selectedCategory,
  onAddTask,
  onCancelAdd,
  categories,
  onCategoriesChange,
  selectedTask,
  selectedDateTasks,
  onCloseTaskDetails,
  onUpdateTask,
  onArchiveTask,
  onTaskChange
}: KanbanBoardDialogsProps) {
  return (
    <>
      <AlertDialog open={!!taskToDelete} onOpenChange={() => onCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (taskToDelete) {
                  onConfirmDelete(taskToDelete.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {addingTaskToColumn && (
        <AddTaskDialog
          columnId={addingTaskToColumn}
          onAdd={onAddTask}
          onCancel={onCancelAdd}
          categories={categories}
          defaultCategory={selectedCategory}
          onCategoriesChange={onCategoriesChange}
        />
      )}

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          tasks={selectedDateTasks || undefined}
          onClose={onCloseTaskDetails}
          onUpdate={onUpdateTask}
          onArchive={onArchiveTask}
          categories={categories}
          onTaskChange={onTaskChange}
        />
      )}
    </>
  );
}