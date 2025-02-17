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
      start_hour: data.start_hour || 6,
      start_minute: data.start_minute || 0,
      end_date: data.end_date,
      end_hour: data.end_hour || 6,
      end_minute: data.end_minute || 0,
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
      start_hour: updates.start_hour,
      start_minute: updates.start_minute,
      end_date: updates.end_date,
      end_hour: updates.end_hour,
      end_minute: updates.end_minute
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
    startDate.setHours(item.start_hour || 6, item.start_minute || 0, 0);
    
    const endDate = new Date(item.end_date);
    endDate.setHours(item.end_hour || 6, item.end_minute || 0, 0);
    
    const now = new Date();
    
    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const minutesPassed = (now.getTime() - startDate.getTime()) / (1000 * 60);
    const daysRemaining = differenceInDays(endDate, now);
    
    let progress = Math.round((minutesPassed / totalMinutes) * 100);
    
    // Ensure progress stays within 0-100 range
    progress = Math.max(0, Math.min(100, progress));

    return {
      ...item,
      progress,
      daysRemaining: Math.max(0, daysRemaining)
    };
  });
}