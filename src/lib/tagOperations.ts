import { supabase } from './supabase';
import { restoreUserContext } from './auth';

export async function addTaskTags(userId: string, taskId: string, tagNames: string[]) {
  await restoreUserContext(userId);
  
  const { error } = await supabase
    .rpc('add_task_tags', {
      p_task_id: taskId,
      p_tag_names: tagNames
    });

  if (error) throw error;
}

export async function removeTaskTags(userId: string, taskId: string, tagIds: string[]) {
  await restoreUserContext(userId);
  
  const { error } = await supabase
    .rpc('remove_task_tags', {
      p_task_id: taskId,
      p_tag_ids: tagIds
    });

  if (error) throw error;
}

export async function getTaskTags(userId: string, taskId: string) {
  await restoreUserContext(userId);
  
  const { data, error } = await supabase
    .from('task_tags')
    .select(`
      tag:tags (
        id,
        name,
        user_id,
        created_at
      )
    `)
    .eq('task_id', taskId);

  if (error) throw error;
  return data.map(item => item.tag);
}

export async function createTag(userId: string, name: string) {
  await restoreUserContext(userId);
  
  const { data, error } = await supabase
    .from('tags')
    .insert([{ name, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTag(userId: string, tagId: string, name: string) {
  await restoreUserContext(userId);
  
  const { data, error } = await supabase
    .from('tags')
    .update({ name })
    .eq('id', tagId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(userId: string, tagId: string) {
  await restoreUserContext(userId);
  
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId);

  if (error) throw error;
}

export async function getAllTags(userId: string) {
  await restoreUserContext(userId);
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data;
}