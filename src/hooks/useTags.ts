import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag } from '@/types/task';
import { restoreUserContext } from '@/lib/auth';

export function useTags(userId: string | undefined) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      await restoreUserContext(userId);
      
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTags();
    }
  }, [userId, loadTags]);

  const handleCreateTag = async (name: string) => {
    if (!userId) return;
    try {
      await restoreUserContext(userId);
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      await loadTags();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error creating tag:', errorMessage);
      throw error;
    }
  };

  return { tags, setTags, loading, error, loadTags, handleCreateTag };
}