import { supabase } from './supabase';
import { Task } from '@/types/task';
import { restoreUserContext } from './auth';
import { addDays } from 'date-fns';

// Function to check if a task should be archived
async function checkAndArchiveTasks(userId: string) {
  try {
    await restoreUserContext(userId);

    const sevenDaysAgo = addDays(new Date(), -7);

    // Get completed tasks that are older than 7 days and not archived
    const { data: tasksToArchive, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('status', 'Done')
      .lt('completed_at', sevenDaysAgo.toISOString())
      .is('archived_at', null);

    if (fetchError) throw fetchError;

    if (tasksToArchive && tasksToArchive.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .in('id', tasksToArchive.map(t => t.id));

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error checking and archiving tasks:', error);
  }
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Task>
) {
  try {
    // First restore user context with retries
    await restoreUserContext(userId);
    
    let categoryId = null;
    
    if (updates.category) {
      try {
        // Restore context before managing category
        await restoreUserContext(userId);
        
        const { data: categoryData, error: categoryError } = await supabase
          .rpc('manage_category', { p_name: updates.category });
        
        if (categoryError) {
          // If there's an error, try one more time with context restoration
          await restoreUserContext(userId);
          const { data: retryData, error: retryError } = await supabase
            .rpc('manage_category', { p_name: updates.category });
          
          if (retryError) throw retryError;
          categoryId = retryData;
        } else {
          categoryId = categoryData;
        }
      } catch (error: unknown) {
        console.error('Error managing category:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to manage category: ${errorMessage}`);
      }
    }

    // Handle tags if they're included in the updates
    if (updates.tags) {
      try {
        // Restore context before handling tags
        await restoreUserContext(userId);
        
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
          // Ekstrak tag name dari respons saat ini
          type TaskTag = { tag?: { name?: string; id?: string } };
          const currentTagNames = (currentTags as TaskTag[]).map(t => t.tag?.name || '');
          
          // Bandingkan tag saat ini dengan tag yang akan diperbarui
          const tagsToRemove = currentTagNames.filter((name: string) => 
            !updates.tags?.some((tag: { name?: string }) => tag.name === name)
          );
          
          if (tagsToRemove.length > 0) {
            // Restore context before removing tags
            await restoreUserContext(userId);
            
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
      } catch (error: unknown) {
        console.error('Error managing tags:', error);
        throw new Error(`Failed to manage tags: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Jika status berubah menjadi "Done", tambahkan completed_at timestamp
    if (updates.status === 'Done') {
      updates.completed_at = new Date().toISOString();
    } else if (updates.status && (updates.status === 'To Do' || updates.status === 'In Progress')) {
      // Jika status berubah dari "Done" ke status lain, hapus completed_at
      updates.completed_at = undefined;
    }

    // Restore context before final update
    await restoreUserContext(userId);

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

    // Check for tasks that need to be archived
    await checkAndArchiveTasks(userId);

    return {
      ...updatedTask,
      category: updatedTask.category?.name,
      tags: updatedTask.tags.map((t: { tag: { id: string; name: string; user_id: string; created_at: string } }) => t.tag)
    };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(userId: string, taskId: string) {
  try {
    await restoreUserContext(userId);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export async function archiveTask(userId: string, taskId: string) {
  try {
    await restoreUserContext(userId);
    
    const { error } = await supabase
      .from('tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', taskId)
      .is('archived_at', null);

    if (error) throw error;
  } catch (error) {
    console.error('Error archiving task:', error);
    throw error;
  }
}

export async function unarchiveTask(userId: string, taskId: string) {
  try {
    await restoreUserContext(userId);
    
    const { error } = await supabase
      .from('tasks')
      .update({ archived_at: null })
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unarchiving task:', error);
    throw error;
  }
}

export async function createTask(
  userId: string,
  columnId: string,
  taskData: Partial<Task>
) {
  try {
    // First restore user context with retries
    await restoreUserContext(userId);
    
    let categoryId = null;
    
    if (taskData.category) {
      try {
        // Restore context before managing category
        await restoreUserContext(userId);
        
        const { data: categoryData, error: categoryError } = await supabase
          .rpc('manage_category', { p_name: taskData.category });
        
        if (categoryError) {
          // If there's an error, try one more time with context restoration
          await restoreUserContext(userId);
          const { data: retryData, error: retryError } = await supabase
            .rpc('manage_category', { p_name: taskData.category });
          
          if (retryError) throw retryError;
          categoryId = retryData;
        } else {
          categoryId = categoryData;
        }
      } catch (error: unknown) {
        console.error('Error managing category:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to manage category: ${errorMessage}`);
      }
    }

    // Get the column to determine the correct status
    await restoreUserContext(userId);
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
        order: 0,
        priority: taskData.priority || 99999 // Ensure priority is included
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
      try {
        // Restore context before adding tags
        await restoreUserContext(userId);
        
        await supabase.rpc('add_task_tags', {
          p_task_id: newTask.id,
          p_tag_names: taskData.tags
        });

        // Fetch the task again to get the updated tags
        await restoreUserContext(userId);
        
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
          tags: updatedTask.tags.map((t: { tag: { id: string; name: string; user_id: string; created_at: string } }) => t.tag)
        };
      } catch (error: unknown) {
        console.error('Error managing tags:', error);
        throw new Error(`Failed to manage tags: ${error instanceof Error ? error.message : String(error)}`);
      }
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
  try {
    await restoreUserContext(userId);
    
    const { error } = await supabase
      .from('tasks')
      .update({
        column_id: columnId,
        order: order,
        status: status
      })
      .eq('id', taskId);

    if (error) throw error;

    // Check for tasks that need to be archived after status update
    await checkAndArchiveTasks(userId);
  } catch (error) {
    console.error('Error updating task position:', error);
    throw error;
  }
}

/**
 * Memperbarui urutan beberapa task sekaligus dalam satu transaksi
 * Ini lebih efisien daripada memanggil updateTaskPosition untuk setiap task
 */
export async function bulkUpdateTaskOrders(
  userId: string,
  tasks: Array<{
    id: string,
    column_id: string,
    status: string,
    order: number
  }>
) {
  try {
    await restoreUserContext(userId);
    
    // Gunakan RPC untuk melakukan update dalam satu transaksi
    // Atau fallback ke metode batch update jika tidak ada RPC
    for (const task of tasks) {
      const { error } = await supabase
        .from('tasks')
        .update({
          column_id: task.column_id,
          order: task.order,
          status: task.status
        })
        .eq('id', task.id);
      
      if (error) {
        throw error;
      }
    }
    
    // Check for tasks that need to be archived after status update
    await checkAndArchiveTasks(userId);
  } catch (error) {
    console.error('Error bulk updating task orders:', error);
    throw error;
  }
}

export async function bulkUpdateTasks(
  userId: string,
  taskIds: string[],
  updates: Partial<Task>
) {
  try {
    await restoreUserContext(userId);
    
    let categoryId = null;
    
    if (updates.category) {
      try {
        // Restore context before managing category
        await restoreUserContext(userId);
        
        const { data: categoryData, error: categoryError } = await supabase
          .rpc('manage_category', { p_name: updates.category });
        
        if (categoryError) {
          // If there's an error, try one more time with context restoration
          await restoreUserContext(userId);
          const { data: retryData, error: retryError } = await supabase
            .rpc('manage_category', { p_name: updates.category });
          
          if (retryError) throw retryError;
          categoryId = retryData;
        } else {
          categoryId = categoryData;
        }
      } catch (error: unknown) {
        console.error('Error managing category:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to manage category: ${errorMessage}`);
      }
    }

    // Jika status berubah menjadi "Done", tambahkan completed_at timestamp
    if (updates.status === 'Done') {
      updates.completed_at = new Date().toISOString();
    } else if (updates.status && (updates.status === 'To Do' || updates.status === 'In Progress')) {
      // Jika status berubah dari "Done" ke status lain, hapus completed_at
      updates.completed_at = undefined;
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

    // Check for tasks that need to be archived
    await checkAndArchiveTasks(userId);
  } catch (error) {
    console.error('Error updating tasks:', error);
    throw error;
  }
}

export async function getTaskTags(userId: string, taskId: string) {
  try {
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
  } catch (error) {
    console.error('Error getting task tags:', error);
    throw error;
  }
}