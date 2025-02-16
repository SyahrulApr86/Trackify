import { useState, useEffect } from 'react';
import { TimeProgressWithProgress } from '@/types/timeProgress';
import { getTimeProgress } from '@/lib/timeProgressOperations';

export function useTimeProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<TimeProgressWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getTimeProgress(userId);
      setProgress(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadProgress();
    }
  }, [userId]);

  return { progress, setProgress, loading, error, loadProgress };
}