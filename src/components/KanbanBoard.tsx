import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ArchiveView } from './ArchiveView';
import { BoardHeader } from './kanban/BoardHeader';
import { DeadlineReminder } from './DeadlineReminder';
import { Task, TaskStatus } from '@/types/task';
import { useBoard } from '@/hooks/useBoard';
import { useCategories } from '@/hooks/useCategories';
import { useArchive } from '@/hooks/useArchive';
import { useTags } from '@/hooks/useTags';
import { KanbanBoardHeader } from './kanban/KanbanBoardHeader';
import { KanbanBoardContent } from './kanban/KanbanBoardContent';
import { KanbanBoardSidebar } from './kanban/KanbanBoardSidebar';
import { KanbanBoardDialogs } from './kanban/KanbanBoardDialogs';
import { updateTask, deleteTask, archiveTask, unarchiveTask, createTask, bulkUpdateTasks, bulkUpdateTaskOrders } from '@/lib/taskOperations';
import { DropResult } from '@hello-pangea/dnd';
import { Button } from './ui/button';

type SortField = 'deadline' | 'priority' | 'none';
type SortOrder = 'asc' | 'desc';

export function KanbanBoard() {
  const { user } = useAuthStore();
  const { board, setBoard, loading: boardLoading, error: boardError, initializeBoard } = useBoard(user?.id);
  const { categories, setCategories, loading: categoriesLoading, loadCategories } = useCategories(user?.id);
  const { archivedTasks, setArchivedTasks, loading: archiveLoading } = useArchive(user?.id);
  const { tags, loading: tagsLoading } = useTags(user?.id);

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'categories' | 'archive'>('kanban');
  const [addingTaskToColumn, setAddingTaskToColumn] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[] | null>(null);
  
  const [kanbanFilter, setKanbanFilter] = useState<string | 'all'>('all');
  const [kanbanTagFilter, setKanbanTagFilter] = useState<string | 'all'>('all');
  const [tableFilters, setTableFilters] = useState<{
    category: string | 'all';
    status: TaskStatus | 'all';
    tag: string | 'all';
  }>({
    category: 'all',
    status: 'all',
    tag: 'all'
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

    // Buat salinan board untuk update lokal (optimistik)
    const newBoard = {
      ...board,
      columns: board.columns.map(col => {
        // Kasus khusus: reordering dalam kolom yang sama
        if (source.droppableId === destination.droppableId && col.id === source.droppableId) {
          const columnTasks = [...col.tasks];
          const [movedTask] = columnTasks.splice(source.index, 1);
          columnTasks.splice(destination.index, 0, {
            ...movedTask,
            order: destination.index
          });

          return {
            ...col,
            tasks: columnTasks.map((t, index) => ({ ...t, order: index }))
          };
        }

        // Pindah antar kolom yang berbeda
        if (col.id === source.droppableId) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== draggableId)
              .map((t, index) => ({ ...t, order: index }))
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

    // Perbarui UI dengan optimistic update
    setBoard(newBoard);

    try {
      // Kumpulkan semua task yang perlu diperbarui
      const tasksToUpdate = [];
      
      // 1. Pertama, tambahkan task yang di-drag
      tasksToUpdate.push({
        id: draggableId,
        column_id: destination.droppableId,
        status: destColumn.title,
        order: destination.index
      });
      
      // 2. Jika dalam kolom yang sama, perbarui semua task dalam kolom tersebut
      if (source.droppableId === destination.droppableId) {
        const columnTasks = newBoard.columns.find(col => col.id === destination.droppableId)?.tasks || [];
        
        // Tambahkan semua task lain yang ada di kolom selain task yang di-drag
        columnTasks.forEach((t, index) => {
          if (t.id !== draggableId) {
            tasksToUpdate.push({
              id: t.id,
              column_id: destination.droppableId,
              status: t.status,
              order: index
            });
          }
        });
      } 
      // 3. Jika pindah antar kolom, perbarui urutan di kedua kolom
      else {
        // Perbarui task di kolom sumber
        const sourceTasks = newBoard.columns.find(col => col.id === source.droppableId)?.tasks || [];
        sourceTasks.forEach((t, index) => {
          tasksToUpdate.push({
            id: t.id,
            column_id: source.droppableId,
            status: t.status,
            order: index
          });
        });
        
        // Perbarui task lain di kolom tujuan
        const destTasks = newBoard.columns.find(col => col.id === destination.droppableId)?.tasks || [];
        destTasks.forEach((t, index) => {
          if (t.id !== draggableId) {
            tasksToUpdate.push({
              id: t.id,
              column_id: destination.droppableId,
              status: t.status,
              order: index
            });
          }
        });
      }
      
      // Gunakan bulkUpdateTaskOrders untuk memperbarui semuanya dalam satu operasi
      await bulkUpdateTaskOrders(user.id, tasksToUpdate);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error updating task position:', errorMessage);
      // Reinisialisasi board jika terjadi kesalahan
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error updating task:', errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error deleting task:', errorMessage);
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    if (!user || !board) return;

    try {
      await archiveTask(user.id, taskId);

      // Find the task to archive
      const taskToArchive = allTasks.find(t => t.id === taskId);
      if (!taskToArchive) return;

      // Update board state
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

      // Update archived tasks state
      setArchivedTasks(prev => [
        {
          ...taskToArchive,
          archived_at: new Date().toISOString()
        },
        ...prev
      ]);

      setSelectedTask(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error archiving task:', errorMessage);
    }
  };

  const handleUnarchiveTask = async (taskId: string) => {
    if (!user) return;
    try {
      await unarchiveTask(user.id, taskId);
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((task) =>
              task.id === taskId ? { ...task, archived_at: undefined } : task
            ),
          })),
        };
      });
      setArchivedTasks((prev) => prev?.filter((task) => task.id !== taskId) ?? []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error unarchiving task:', errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error adding task:', errorMessage);
    }
  };

  const handleBulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>) => {
    if (!board || !user) return;

    try {
      await bulkUpdateTasks(user.id, taskIds, updates);
      await initializeBoard();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error updating tasks:', errorMessage);
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
      columns: board.columns.map(column => {
        // Filter dan sort tanpa mengubah property order asli
        const filteredTasks = sortTasks(
          filterTasksByTag(
            filterTasksBySearch(column.tasks),
            kanbanTagFilter
          ).filter(task => 
            kanbanFilter === 'all' || task.category === kanbanFilter
          )
        );
        
        return {
          ...column,
          tasks: filteredTasks
        };
      })
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

  const handleTableFiltersChange = (filters: {
    category?: string | 'all';
    status?: TaskStatus | 'all';
    tag?: string | 'all';
  }) => {
    setTableFilters(prev => ({
      ...prev,
      ...filters
    }));
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
            onTableFiltersChange={handleTableFiltersChange}
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