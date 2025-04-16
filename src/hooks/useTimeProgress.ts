import { useState, useEffect, useCallback } from 'react';
import { TimeProgressWithProgress } from '@/types/timeProgress';
import { getTimeProgress } from '@/lib/timeProgressOperations';
import { restoreUserContext } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function useTimeProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<TimeProgressWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getTimeProgress(userId);
      setProgress(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProgress();
    }
  }, [userId, loadProgress]);

  const handleCreateProgress = async (title: string, startDate: Date, endDate: Date) => {
    if (!userId) return;
    try {
      await restoreUserContext(userId);
      const { data, error } = await supabase
        .from('time_progress')
        .insert([{ 
          title, 
          start_date: startDate.toISOString(), 
          end_date: endDate.toISOString(),
          user_id: userId 
        }])
        .select()
        .single();

      if (error) throw error;

      await loadProgress();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error creating progress:', errorMessage);
      throw error;
    }
  };

  return { progress, setProgress, loading, error, loadProgress, handleCreateProgress };
}