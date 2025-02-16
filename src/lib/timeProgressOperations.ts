import { supabase } from './supabase';
import { TimeProgress, TimeProgressWithProgress } from '@/types/timeProgress';
import { restoreUserContext } from './auth';
import { differenceInDays } from 'date-fns';

export async function createTimeProgress(userId: string, data: Partial<TimeProgress>) {
  await restoreUserContext(userId);
  
  const { data: progress, error } = await supabase
    .from('time_progress')
    .insert([{
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      user_id: userId
    }])
    .select()
    .single();

  if (error) throw error;
  return progress;
}

export async function updateTimeProgress(userId: string, progressId: string, updates: Partial<TimeProgress>) {
  await restoreUserContext(userId);
  
  const { data: progress, error } = await supabase
    .from('time_progress')
    .update({
      title: updates.title,
      start_date: updates.start_date,
      end_date: updates.end_date
    })
    .eq('id', progressId)
    .select()
    .single();

  if (error) throw error;
  return progress;
}

export async function deleteTimeProgress(userId: string, progressId: string) {
  await restoreUserContext(userId);
  
  const { error } = await supabase
    .from('time_progress')
    .delete()
    .eq('id', progressId);

  if (error) throw error;
}

export async function getTimeProgress(userId: string): Promise<TimeProgressWithProgress[]> {
  await restoreUserContext(userId);
  
  const { data: progress, error } = await supabase
    .from('time_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return progress.map(item => {
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);
    const today = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    const daysPassed = differenceInDays(today, startDate);
    const daysRemaining = differenceInDays(endDate, today);
    
    let progress = Math.round((daysPassed / totalDays) * 100);
    
    // Ensure progress stays within 0-100 range
    progress = Math.max(0, Math.min(100, progress));

    return {
      ...item,
      progress,
      daysRemaining: Math.max(0, daysRemaining)
    };
  });
}