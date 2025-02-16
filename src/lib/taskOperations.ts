import { supabase } from './supabase';
import { Task } from '@/types/task';
import { restoreUserContext } from './auth';

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Task>
) {
  await restoreUserContext(userId);
  
  let categoryId = null;
  
  if (updates.category) {
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('manage_category', { p_name: updates.category });
    
    if (categoryError) throw categoryError;
    categoryId = categoryData;
  }

  // Handle tags if they're included in the updates
  if (updates.tags) {
    await supabase.rpc('add_task_tags', {
      p_task_id: taskId,
      p_tag_names: updates.tags
    });

    // Remove any existing tags that aren't in the new list
    const { data: currentTags } = await supabase
      .from('task_tags')
      .select('tag:tags (id, name)')
      .eq('task_id', taskId);

    if (currentTags) {
      const currentTagNames = currentTags.map(t => t.tag.name);
      const tagsToRemove = currentTagNames.filter(name => !updates.tags?.includes(name));
      
      if (tagsToRemove.length > 0) {
        const { data: tagsToDelete } = await supabase
          .from('tags')
          .select('id')
          .in('name', tagsToRemove)
          .eq('user_id', userId);

        if (tagsToDelete && tagsToDelete.length > 0) {
          await supabase.rpc('remove_task_tags', {
            p_task_id: taskId,
            p_tag_ids: tagsToDelete.map(t => t.id)
          });
        }
      }
    }
  }

  const taskUpdates = {
    ...updates,
    category_id: categoryId
  };
  delete taskUpdates.category;
  delete taskUpdates.tags;

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(taskUpdates)
    .eq('id', taskId)
    .select(`
      *,
      category:categories(name),
      tags:task_tags(
        tag:tags(
          id,
          name,
          user_id,
          created_at
        )
      )
    `)
    .single();

  if (error) throw error;

  return {
    ...updatedTask,
    category: updatedTask.category?.name,
    tags: updatedTask.tags.map(t => t.tag)
  };
}

export async function deleteTask(userId: string, taskId: string) {
  await restoreUserContext(userId);
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function archiveTask(userId: string, taskId: string) {
  await restoreUserContext(userId);
  await supabase.rpc('archive_task', { task_id: taskId });
}

export async function unarchiveTask(userId: string, taskId: string) {
  await restoreUserContext(userId);
  await supabase.rpc('unarchive_task', { task_id: taskId });
}

export async function createTask(
  userId: string,
  columnId: string,
  taskData: Partial<Task>
) {
  try {
    // First restore user context
    await restoreUserContext(userId);
    
    let categoryId = null;
    
    if (taskData.category) {
      // Restore context again before managing category
      await restoreUserContext(userId);
      
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('manage_category', { p_name: taskData.category });
      
      if (categoryError) throw categoryError;
      categoryId = categoryData;
    }

    // Get the column to determine the correct status
    const { data: column, error: columnError } = await supabase
      .from('columns')
      .select('title')
      .eq('id', columnId)
      .single();

    if (columnError) throw columnError;

    // Restore context again before creating task
    await restoreUserContext(userId);

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert([{
        title: taskData.title,
        description: taskData.description,
        deadline: taskData.deadline,
        category_id: categoryId,
        column_id: columnId,
        user_id: userId,
        status: column.title,
        order: 0
      }])
      .select(`
        *,
        category:categories(name),
        tags:task_tags(
          tag:tags(
            id,
            name,
            user_id,
            created_at
          )
        )
      `)
      .single();

    if (error) throw error;

    // Add tags if they're included
    if (taskData.tags && taskData.tags.length > 0) {
      await supabase.rpc('add_task_tags', {
        p_task_id: newTask.id,
        p_tag_names: taskData.tags
      });

      // Fetch the task again to get the updated tags
      const { data: updatedTask, error: refreshError } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(name),
          tags:task_tags(
            tag:tags(
              id,
              name,
              user_id,
              created_at
            )
          )
        `)
        .eq('id', newTask.id)
        .single();

      if (refreshError) throw refreshError;

      return {
        ...updatedTask,
        category: updatedTask.category?.name,
        tags: updatedTask.tags.map(t => t.tag)
      };
    }

    return {
      ...newTask,
      category: newTask.category?.name,
      tags: []
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTaskPosition(
  userId: string,
  taskId: string,
  columnId: string,
  status: string,
  order: number
) {
  await restoreUserContext(userId);
  
  await supabase
    .from('tasks')
    .update({
      column_id: columnId,
      order: order,
      status: status
    })
    .eq('id', taskId);
}

export async function bulkUpdateTasks(
  userId: string,
  taskIds: string[],
  updates: Partial<Task>
) {
  await restoreUserContext(userId);
  
  let categoryId = null;
  
  if (updates.category) {
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('manage_category', { p_name: updates.category });
    
    if (categoryError) throw categoryError;
    categoryId = categoryData;
  }

  const taskUpdates = {
    ...updates,
    category_id: categoryId
  };
  delete taskUpdates.category;
  delete taskUpdates.tags;

  const { error } = await supabase
    .from('tasks')
    .update(taskUpdates)
    .in('id', taskIds);

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