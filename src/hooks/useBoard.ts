import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Board } from '@/types/task';
import { restoreUserContext } from '@/lib/auth';

export function useBoard(userId: string | undefined) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeBoard = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      await restoreUserContext(userId);

      let { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (boardsError) throw boardsError;

      let boardId;
      if (!boards || boards.length === 0) {
        const { data: newBoard, error: createBoardError } = await supabase
          .from('boards')
          .insert([{ 
            title: 'My Board',
            user_id: userId
          }])
          .select()
          .single();

        if (createBoardError) throw createBoardError;
        boardId = newBoard.id;
      } else {
        boardId = boards[0].id;
      }

      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select(`
          *,
          tasks (
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
          )
        `)
        .eq('board_id', boardId)
        .order('order', { ascending: true });

      if (columnsError) throw columnsError;

      if (!columns || columns.length === 0) {
        const defaultColumns = [
          { title: 'To Do', order: 0, board_id: boardId },
          { title: 'In Progress', order: 1, board_id: boardId },
          { title: 'Done', order: 2, board_id: boardId }
        ];

        for (const col of defaultColumns) {
          const { error: createColumnError } = await supabase
            .from('columns')
            .insert([col]);

          if (createColumnError) throw createColumnError;
        }

        const { data: newColumns, error: newColumnsError } = await supabase
          .from('columns')
          .select(`
            *,
            tasks (
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
            )
          `)
          .eq('board_id', boardId)
          .order('order', { ascending: true });

        if (newColumnsError) throw newColumnsError;

        setBoard({
          id: boardId,
          title: 'My Board',
          columns: newColumns.map(col => ({
            ...col,
            tasks: (col.tasks || []).map(task => ({
              ...task,
              category: task.category?.name,
              tags: task.tags?.map(t => t.tag) || []
            })).filter(task => !task.archived_at)
          })) || []
        });
      } else {
        setBoard({
          id: boardId,
          title: 'My Board',
          columns: columns.map(col => ({
            ...col,
            tasks: (col.tasks || []).map(task => ({
              ...task,
              category: task.category?.name,
              tags: task.tags?.map(t => t.tag) || []
            })).filter(task => !task.archived_at)
          }))
        });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      initializeBoard();
    }
  }, [userId]);

  return { board, setBoard, loading, error, initializeBoard };
}