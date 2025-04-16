import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/task';
import { restoreUserContext } from '@/lib/auth';

export function useArchive(userId: string | undefined) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchivedTasks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      await restoreUserContext(userId);
      
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('user_id', userId)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (tasksError) throw tasksError;
      
      const processedTasks = tasks?.map(task => ({
        ...task,
        category: task.category?.name
      })) || [];
      
      setArchivedTasks(processedTasks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadArchivedTasks();
    }
  }, [userId, loadArchivedTasks]);

  const handleArchive = async (taskId: string) => {
    if (!userId) return;
    try {
      await restoreUserContext(userId);
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      await loadArchivedTasks();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error archiving task:', errorMessage);
    }
  };

  return { archivedTasks, setArchivedTasks, loading, error, loadArchivedTasks, handleArchive };
}