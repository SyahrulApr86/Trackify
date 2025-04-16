import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryColor } from '@/types/task';
import { restoreUserContext } from '@/lib/auth';

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      await restoreUserContext(userId);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadCategories();
    }
  }, [userId, loadCategories]);

  const handleCreateCategory = async (name: string, color: CategoryColor) => {
    if (!userId) return;
    try {
      await restoreUserContext(userId);
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, color, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      await loadCategories();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error creating category:', errorMessage);
      throw error;
    }
  };

  return { categories, setCategories, loading, error, loadCategories, handleCreateCategory };
}