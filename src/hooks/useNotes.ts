import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { getNotes } from '@/lib/noteOperations';
import { restoreUserContext } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const notes = await getNotes(userId);
      setNotes(notes);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadNotes();
    }
  }, [userId, loadNotes]);

  const handleCreateNote = async (content: string) => {
    if (!userId) return;
    try {
      await restoreUserContext(userId);
      const { data, error } = await supabase
        .from('notes')
        .insert([{ content, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      await loadNotes();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error creating note:', errorMessage);
      throw error;
    }
  };

  return { notes, setNotes, loading, error, loadNotes, handleCreateNote };
}