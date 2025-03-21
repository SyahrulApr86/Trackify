import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ArchiveView } from './ArchiveView';
import { BoardHeader } from './BoardHeader';
import { DeadlineReminder } from './DeadlineReminder';
import { Task, TaskStatus } from '@/types/task';
import { useBoard } from '@/hooks/useBoard';
import { useCategories } from '@/hooks/useCategories';
import { useArchive } from '@/hooks/useArchive';
import { useTags } from '@/hooks/useTags';
import { KanbanBoardHeader } from './KanbanBoardHeader';
import { KanbanBoardContent } from './KanbanBoardContent';
import { KanbanBoardSidebar } from './KanbanBoardSidebar';
import { KanbanBoardDialogs } from './KanbanBoardDialogs';
import { updateTask, deleteTask, archiveTask, unarchiveTask, createTask, updateTaskPosition, bulkUpdateTasks } from '@/lib/taskOperations';

type SortField = 'deadline' | 'priority' | 'none';
type SortOrder = 'asc' | 'desc';

export function KanbanBoard() {
  const { user } = useAuthStore();
  const { board, setBoard, loading: boardLoading, error: boardError, initializeBoard } = useBoard(user?.id);
  const { categories, setCategories, loading: categoriesLoading, loadCategories } = useCategories(user?.id);
  const { archivedTasks, loading: archiveLoading, loadArchivedTasks } = useArchive(user?.id);
  const { tags, loading: tagsLoading } = useTags(user?.id);

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'categories' | 'archive'>('kanban');
  const [addingTaskToColumn, setAddingTaskToColumn] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[] | null>(null);
  
  const [kanbanFilter, setKanbanFilter] = useState<string | 'all'>('all');
  const [kanbanTagFilter, setKanbanTagFilter] = useState<string | 'all'>('all');
  const [tableFilters, setTableFilters] = useState({
    category: 'all' as string | 'all',
    status: 'all' as TaskStatus | 'all',
    tag: 'all' as string | 'all'
  });
  const [categoryViewStatus, setCategoryViewStatus] = useState<TaskStatus | 'all'>('all');
  const [categoryViewTag, setCategoryViewTag] = useState<string | 'all'>('all');

  const [sortField, setSortField] = useState<SortField>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const loading = boardLoading || categoriesLoading || archiveLoading || tagsLoading;

  // Get all tasks from the board
  const allTasks = board?.columns.flatMap(column => column.tasks) || [];

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

    const newBoard = {
      ...board,
      columns: board.columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== draggableId)
          };
        }
        if (col.id === destination.droppableId) {
          const updatedTask = {
            ...task,
            column_id: destination.droppableId,
            status: destColumn.title as Task['status'],
            order: destination.index
          };
          const newTasks = [...col.tasks];
          newTasks.splice(destination.index, 0, updatedTask);
          return {
            ...col,
            tasks: newTasks.map((t, index) => ({ ...t, order: index }))
          };
        }
        return col;
      })
    };

    setBoard(newBoard);

    try {
      await updateTaskPosition(
        user.id,
        draggableId,
        destination.droppableId,
        destColumn.title,
        destination.index
      );

      const destTasks = newBoard.columns.find(col => col.id === destination.droppableId)?.tasks || [];
      for (const [index, t] of destTasks.entries()) {
        if (t.id !== draggableId) {
          await updateTaskPosition(user.id, t.id, destination.droppableId, t.status, index);
        }
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
      setSelectedCategory(null);
      
      if (taskData.category && !categories.some(cat => cat.name === taskData.category)) {
        await loadCategories();
      }
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

  const handleDateClick = (date: Date) => {
    const tasksForDate = allTasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });

    if (tasksForDate.length > 0) {
      setSelectedTask(tasksForDate[0]);
      setSelectedDateTasks(tasksForDate);
    }
  };

  const handleTaskChange = (task: Task) => {
    setSelectedTask(task);
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

  const sortTasks = (tasks: Task[]) => {
    if (sortField === 'none') return tasks;

    return [...tasks].sort((a, b) => {
      if (sortField === 'deadline') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return sortOrder === 'asc' ? 1 : -1;
        if (!b.deadline) return sortOrder === 'asc' ? -1 : 1;
        const result = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        return sortOrder === 'asc' ? result : -result;
      }
      
      if (sortField === 'priority') {
        const result = a.priority - b.priority;
        return sortOrder === 'asc' ? result : -result;
      }
      
      return 0;
    });
  };

  const getFilteredBoard = () => {
    if (!board) return null;

    return {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tasks: sortTasks(
          filterTasksByTag(
            filterTasksBySearch(column.tasks),
            kanbanTagFilter
          ).filter(task => 
            kanbanFilter === 'all' || task.category === kanbanFilter
          )
        ).map((task, index) => ({
          ...task,
          order: index
        }))
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
      return sortTasks(
        filterTasksByTag(searchFilteredTasks, categoryViewTag).filter(task => {
          const matchesStatus = categoryViewStatus === 'all' || task.status === categoryViewStatus;
          return matchesStatus;
        })
      );
    }
  };

  const filteredBoard = getFilteredBoard();
  const filteredTasks = getFilteredTasks();

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
      <DeadlineReminder 
        tasks={allTasks} 
        categories={categories} 
        onTaskClick={setSelectedTask} 
      />
      
      <BoardHeader
        title={board.title}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'archive' ? (
        <ArchiveView
          tasks={archivedTasks}
          categories={categories}
          onUnarchive={handleUnarchiveTask}
          onTaskClick={setSelectedTask}
        />
      ) : (
        <>
          <KanbanBoardHeader
            viewMode={viewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            onSortFieldChange={setSortField}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            kanbanFilter={kanbanFilter}
            onKanbanFilterChange={setKanbanFilter}
            kanbanTagFilter={kanbanTagFilter}
            onKanbanTagFilterChange={setKanbanTagFilter}
            tableFilters={tableFilters}
            onTableFiltersChange={setTableFilters}
            categoryViewStatus={categoryViewStatus}
            onCategoryViewStatusChange={setCategoryViewStatus}
            categoryViewTag={categoryViewTag}
            onCategoryViewTagChange={setCategoryViewTag}
            categories={categories}
            tags={tags}
          />

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9">
              <KanbanBoardContent
                viewMode={viewMode}
                filteredBoard={filteredBoard}
                filteredTasks={filteredTasks}
                addingTaskToColumn={addingTaskToColumn}
                onAddTask={setAddingTaskToColumn}
                onCancelAdd={() => {
                  setAddingTaskToColumn(null);
                  setSelectedCategory(null);
                }}
                onDeleteTask={setTaskToDelete}
                onTaskClick={setSelectedTask}
                categories={categories}
                onUpdateTask={handleUpdateTask}
                onBulkUpdateTasks={handleBulkUpdateTasks}
                onAddTaskToCategory={handleAddTaskToCategory}
                onCategoriesChange={setCategories}
                onDragEnd={handleDragEnd}
              />
            </div>

            <div className="col-span-12 lg:col-span-3">
              <KanbanBoardSidebar
                tasks={allTasks}
                onDateClick={handleDateClick}
              />
            </div>
          </div>
        </>
      )}

      <KanbanBoardDialogs
        taskToDelete={taskToDelete}
        onCancelDelete={() => setTaskToDelete(null)}
        onConfirmDelete={handleDeleteTask}
        addingTaskToColumn={addingTaskToColumn}
        selectedCategory={selectedCategory}
        onAddTask={handleAddTask}
        onCancelAdd={() => {
          setAddingTaskToColumn(null);
          setSelectedCategory(null);
        }}
        categories={categories}
        onCategoriesChange={loadCategories}
        selectedTask={selectedTask}
        selectedDateTasks={selectedDateTasks}
        onCloseTaskDetails={() => {
          setSelectedTask(null);
          setSelectedDateTasks(null);
        }}
        onUpdateTask={handleUpdateTask}
        onArchiveTask={handleArchiveTask}
        onTaskChange={handleTaskChange}
      />
    </div>
  );
}