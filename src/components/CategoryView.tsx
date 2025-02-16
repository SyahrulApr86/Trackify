import React, { useState } from 'react';
import { Task, Category } from '@/types/task';
import { StaticTaskCard } from './kanban/StaticTaskCard';
import { Button } from './ui/button';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { restoreUserContext } from '@/lib/auth';

interface CategoryViewProps {
  tasks: Task[];
  categories: Category[];
  onDeleteTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (category: string) => void;
  onCategoriesChange: (categories: Category[]) => void;
}

export function CategoryView({
  tasks,
  categories,
  onDeleteTask,
  onTaskClick,
  onAddTask,
  onCategoriesChange
}: CategoryViewProps) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  
  const tasksByCategory = categories.reduce((acc, category) => {
    acc[category.name] = tasks.filter(task => task.category === category.name);
    return acc;
  }, {} as Record<string, Task[]>);

  const uncategorizedTasks = tasks.filter(task => !task.category);

  const handleDeleteCategory = async (category: Category) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // First restore user context
      await restoreUserContext(user.id);
      
      // Then attempt to delete the category
      const { data, error } = await supabase
        .rpc('delete_category', { p_category_id: category.id });

      if (error) throw error;

      if (!data) {
        setError('Cannot delete category that contains tasks');
        return;
      }

      // Restore context again before fetching updated categories
      await restoreUserContext(user.id);

      // Fetch updated categories list
      const { data: updatedCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (categoriesError) throw categoriesError;
      onCategoriesChange(updatedCategories || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setCategoryToDelete(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // First restore user context
      await restoreUserContext(user.id);
      
      // Attempt to create/manage the category
      const { error: categoryError } = await supabase
        .rpc('manage_category', { p_name: newCategoryName.trim() });

      if (categoryError) throw categoryError;

      // Restore context again before fetching updated categories
      await restoreUserContext(user.id);

      // Fetch updated categories list
      const { data: updatedCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (categoriesError) throw categoriesError;
      onCategoriesChange(updatedCategories || []);

      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Button
          onClick={() => {
            setError(null);
            setIsCreatingCategory(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map(category => (
          <div key={category.id} className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{category.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {tasksByCategory[category.name]?.length || 0} tasks
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setCategoryToDelete(category)}
                  disabled={tasksByCategory[category.name]?.length > 0 || isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {tasksByCategory[category.name]?.map((task) => (
                <StaticTaskCard
                  key={task.id}
                  task={task}
                  onDelete={onDeleteTask}
                  onClick={onTaskClick}
                />
              ))}
              <Button
                onClick={() => onAddTask(category.name)}
                variant="ghost"
                className="w-full flex items-center gap-1 text-muted-foreground hover:text-foreground group"
              >
                <Plus size={16} className="transition-transform group-hover:scale-125" />
                Add task
              </Button>
            </div>
          </div>
        ))}
        
        {uncategorizedTasks.length > 0 && (
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Uncategorized</h3>
              <span className="text-sm text-muted-foreground">
                {uncategorizedTasks.length} tasks
              </span>
            </div>
            <div className="p-4 space-y-3">
              {uncategorizedTasks.map((task) => (
                <StaticTaskCard
                  key={task.id}
                  task={task}
                  onDelete={onDeleteTask}
                  onClick={onTaskClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreatingCategory} onOpenChange={setIsCreatingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name..."
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewCategoryName('');
                setError(null);
                setIsCreatingCategory(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
              {tasksByCategory[categoryToDelete?.name || '']?.length > 0 && (
                <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  This category cannot be deleted because it contains tasks. Move or delete the tasks first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              disabled={tasksByCategory[categoryToDelete?.name || '']?.length > 0 || isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}