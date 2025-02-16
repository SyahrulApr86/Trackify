import { supabase } from './supabase';
import { Note } from '@/types/note';
import { restoreUserContext } from './auth';

export async function createNote(userId: string, data: Partial<Note>) {
  await restoreUserContext(userId);
  
  const { data: note, error } = await supabase
    .from('notes')
    .insert([{
      ...data,
      user_id: userId
    }])
    .select()
    .single();

  if (error) throw error;
  return note;
}

export async function updateNote(userId: string, noteId: string, updates: Partial<Note>) {
  await restoreUserContext(userId);
  
  const { data: note, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return note;
}

export async function deleteNote(userId: string, noteId: string) {
  await restoreUserContext(userId);
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

export async function getNotes(userId: string) {
  await restoreUserContext(userId);
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return notes;
}

export async function getNotesByDate(userId: string, date: string) {
  await restoreUserContext(userId);
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return notes;
}