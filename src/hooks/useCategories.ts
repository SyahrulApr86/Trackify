import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/task';
import { restoreUserContext } from '@/lib/auth';

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCategories();
    }
  }, [userId]);

  return { categories, setCategories, loading, error, loadCategories };
}