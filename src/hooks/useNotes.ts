import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { getNotes } from '@/lib/noteOperations';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const notes = await getNotes(userId);
      setNotes(notes);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotes();
    }
  }, [userId]);

  return { notes, setNotes, loading, error, loadNotes };
}