import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/task';
import { restoreUserContext } from '@/lib/auth';

export function useArchive(userId: string | undefined) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchivedTasks = async () => {
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadArchivedTasks();
    }
  }, [userId]);

  return { archivedTasks, setArchivedTasks, loading, error, loadArchivedTasks };
}