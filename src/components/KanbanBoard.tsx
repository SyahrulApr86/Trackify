import React, { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { TaskTable } from './TaskTable';
import { CategoryView } from './CategoryView';
import { ArchiveView } from './ArchiveView';
import { BoardHeader } from './kanban/BoardHeader';
import { BoardColumn } from './kanban/BoardColumn';
import { TaskDetailsDialog } from './kanban/TaskDetailsDialog';
import { TaskFilters } from './TaskFilters';
import { TaskSearch } from './TaskSearch';
import { DeadlineReminder } from './DeadlineReminder';
import { TimeProgressBar } from './TimeProgressBar';
import { Task, TaskStatus } from '@/types/task';
import { useBoard } from '@/hooks/useBoard';
import { useCategories } from '@/hooks/useCategories';
import { useArchive } from '@/hooks/useArchive';
import { useTags } from '@/hooks/useTags';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AddTaskDialog } from './kanban/AddTaskDialog';
import { updateTask, deleteTask, archiveTask, unarchiveTask, createTask, updateTaskPosition, bulkUpdateTasks } from '@/lib/taskOperations';

export function KanbanBoard() {
  const { user } = useAuthStore();
  const { board, setBoard, loading: boardLoading, error: boardError, initializeBoard } = useBoard(user?.id);
  const { categories, setCategories, loading: categoriesLoading } = useCategories(user?.id);
  const { archivedTasks, loading: archiveLoading, loadArchivedTasks } = useArchive(user?.id);
  const { tags, loading: tagsLoading } = useTags(user?.id);

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'categories' | 'archive'>('kanban');
  const [addingTaskToColumn, setAddingTaskToColumn] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Separate filter states for different views
  const [kanbanFilter, setKanbanFilter] = useState<string | 'all'>('all');
  const [kanbanTagFilter, setKanbanTagFilter] = useState<string | 'all'>('all');
  const [tableFilters, setTableFilters] = useState({
    category: 'all' as string | 'all',
    status: 'all' as TaskStatus | 'all',
    tag: 'all' as string | 'all'
  });
  const [categoryViewStatus, setCategoryViewStatus] = useState<TaskStatus | 'all'>('all');
  const [categoryViewTag, setCategoryViewTag] = useState<string | 'all'>('all');

  // Add search state
  const [searchQuery, setSearchQuery] = useState('');

  const loading = boardLoading || categoriesLoading || archiveLoading || tagsLoading;

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board || !user) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = board.columns.find(col => col.id === source.droppableId);
    const destColumn = board.columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;

    const task = sourceColumn.tasks.find(t => t.id === draggableId);
    if (!task) return;

    const updatedTask = {
      ...task,
      column_id: destination.droppableId,
      status: destColumn.title as Task['status']
    };

    const newSourceTasks = Array.from(sourceColumn.tasks);
    newSourceTasks.splice(source.index, 1);

    const newDestTasks = Array.from(destColumn.tasks);
    newDestTasks.splice(destination.index, 0, updatedTask);

    const newColumns = board.columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tasks: newSourceTasks };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tasks: newDestTasks };
      }
      return col;
    });

    setBoard({ ...board, columns: newColumns });

    try {
      await updateTaskPosition(
        user.id,
        draggableId,
        destination.droppableId,
        destColumn.title,
        destination.index
      );

      for (const [index, task] of newDestTasks.entries()) {
        await updateTaskPosition(user.id, task.id, destination.droppableId, task.status, index);
      }
    } catch (error) {
      console.error('Error updating task position:', error);
      initializeBoard();
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!board || !user) return;

    try {
      const updatedTask = await updateTask(user.id, taskId, updates);

      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map(col => ({
            ...col,
            tasks: col.tasks.map(task => 
              task.id === taskId ? updatedTask : task
            )
          }))
        };
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!board || !user) return;

    try {
      await deleteTask(user.id, taskId);

      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map(col => ({
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          }))
        };
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    if (!user) return;

    try {
      await archiveTask(user.id, taskId);
      await initializeBoard();
      await loadArchivedTasks();
      setSelectedTask(null);
    } catch (error: any) {
      console.error('Error archiving task:', error);
    }
  };

  const handleUnarchiveTask = async (taskId: string) => {
    if (!user) return;

    try {
      await unarchiveTask(user.id, taskId);
      await loadArchivedTasks();
      await initializeBoard();
    } catch (error: any) {
      console.error('Error unarchiving task:', error);
    }
  };

  const handleAddTask = async (columnId: string, taskData: Partial<Task>) => {
    if (!board || !user) return;

    try {
      const newTask = await createTask(user.id, columnId, taskData);

      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                tasks: [...col.tasks, newTask]
              };
            }
            return col;
          })
        };
      });

      setAddingTaskToColumn(null);
    } catch (error: any) {
      console.error('Error adding task:', error);
    }
  };

  const handleBulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>) => {
    if (!board || !user) return;

    try {
      await bulkUpdateTasks(user.id, taskIds, updates);
      await initializeBoard();
    } catch (error: any) {
      console.error('Error updating tasks:', error);
    }
  };

  const handleAddTaskToCategory = (category: string) => {
    if (!board) return;
    
    const toDoColumn = board.columns.find(col => col.title === 'To Do');
    if (!toDoColumn) return;

    setAddingTaskToColumn(toDoColumn.id);
    setSelectedCategory(category);
  };

  const filterTasksBySearch = (tasks: Task[]) => {
    if (!searchQuery.trim()) return tasks;
    
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description?.toLowerCase().includes(query))
    );
  };

  const filterTasksByTag = (tasks: Task[], tagFilter: string | 'all') => {
    if (tagFilter === 'all') return tasks;
    return tasks.filter(task => 
      task.tags?.some(tag => tag.name === tagFilter)
    );
  };

  const getFilteredBoard = () => {
    if (!board) return null;

    return {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tasks: filterTasksByTag(
          filterTasksBySearch(column.tasks),
          kanbanTagFilter
        ).filter(task => 
          kanbanFilter === 'all' || task.category === kanbanFilter
        )
      }))
    };
  };

  const getFilteredTasks = () => {
    if (!board) return [];
    
    const allTasks = board.columns.flatMap(column => column.tasks);
    const searchFilteredTasks = filterTasksBySearch(allTasks);
    
    if (viewMode === 'table') {
      return filterTasksByTag(searchFilteredTasks, tableFilters.tag).filter(task => {
        const matchesCategory = tableFilters.category === 'all' || task.category === tableFilters.category;
        const matchesStatus = tableFilters.status === 'all' || task.status === tableFilters.status;
        return matchesCategory && matchesStatus;
      });
    } else {
      return filterTasksByTag(searchFilteredTasks, categoryViewTag).filter(task => {
        const matchesStatus = categoryViewStatus === 'all' || task.status === categoryViewStatus;
        return matchesStatus;
      });
    }
  };

  const getAllTasks = () => {
    if (!board) return [];
    return board.columns.flatMap(column => column.tasks);
  };

  const filteredBoard = getFilteredBoard();
  const filteredTasks = getFilteredTasks();
  const allTasks = getAllTasks();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (boardError) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
        <p className="text-destructive">{boardError}</p>
        <Button
          onClick={initializeBoard}
          variant="outline"
          className="mt-2"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!board || !filteredBoard) return null;

  return (
    <div className="space-y-6">
      <DeadlineReminder tasks={allTasks} onTaskClick={setSelectedTask} />
      
      <BoardHeader
        title={board.title}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'archive' ? (
        <ArchiveView
          tasks={archivedTasks}
          onUnarchive={handleUnarchiveTask}
          onTaskClick={setSelectedTask}
        />
      ) : (
        <>
          <div className="space-y-4">
            <TaskSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search task titles and descriptions..."
            />

            {viewMode === 'kanban' && (
              <TaskFilters
                selectedCategory={kanbanFilter}
                selectedTag={kanbanTagFilter}
                onCategoryChange={setKanbanFilter}
                onTagChange={setKanbanTagFilter}
                showStatusFilter={false}
                categories={categories}
                tags={tags}
              />
            )}
            {viewMode === 'table' && (
              <TaskFilters
                selectedCategory={tableFilters.category}
                selectedStatus={tableFilters.status}
                selectedTag={tableFilters.tag}
                onCategoryChange={(category) => setTableFilters(prev => ({ ...prev, category }))}
                onStatusChange={(status) => setTableFilters(prev => ({ ...prev, status }))}
                onTagChange={(tag) => setTableFilters(prev => ({ ...prev, tag }))}
                showStatusFilter={true}
                categories={categories}
                tags={tags}
              />
            )}
            {viewMode === 'categories' && (
              <TaskFilters
                selectedStatus={categoryViewStatus}
                selectedTag={categoryViewTag}
                onStatusChange={setCategoryViewStatus}
                onTagChange={setCategoryViewTag}
                showStatusFilter={true}
                showCategoryFilter={false}
                categories={categories}
                tags={tags}
              />
            )}
          </div>
          
          {viewMode === 'kanban' ? (
            <div className="space-y-6">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-3 gap-4">
                  {filteredBoard.columns.map((column) => (
                    <BoardColumn
                      key={column.id}
                      column={column}
                      addingTaskToColumn={addingTaskToColumn}
                      onAddTask={(columnId) => setAddingTaskToColumn(columnId)}
                      onCancelAdd={() => {
                        setAddingTaskToColumn(null);
                        setSelectedCategory(null);
                      }}
                      onDeleteTask={setTaskToDelete}
                      onTaskClick={setSelectedTask}
                      categories={categories}
                    />
                  ))}
                </div>
              </DragDropContext>

              {/* Time Progress Bar at the bottom */}
              <div className="mt-8 pt-8 border-t">
                <TimeProgressBar />
              </div>
            </div>
          ) : viewMode === 'categories' ? (
            <div className="space-y-6">
              <CategoryView
                tasks={filteredTasks}
                categories={categories}
                onDeleteTask={setTaskToDelete}
                onTaskClick={setSelectedTask}
                onAddTask={handleAddTaskToCategory}
                onCategoriesChange={setCategories}
              />

              {/* Time Progress Bar at the bottom */}
              <div className="mt-8 pt-8 border-t">
                <TimeProgressBar />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <TaskTable
                tasks={filteredTasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onBulkUpdateTasks={handleBulkUpdateTasks}
                categories={categories}
              />

              {/* Time Progress Bar at the bottom */}
              <div className="mt-8 pt-8 border-t">
                <TimeProgressBar />
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
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
                  handleDeleteTask(taskToDelete.id);
                  setTaskToDelete(null);
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
          onAdd={handleAddTask}
          onCancel={() => {
            setAddingTaskToColumn(null);
            setSelectedCategory(null);
          }}
          categories={categories}
          defaultCategory={selectedCategory}
        />
      )}

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onArchive={handleArchiveTask}
          categories={categories}
        />
      )}
    </div>
  );
}