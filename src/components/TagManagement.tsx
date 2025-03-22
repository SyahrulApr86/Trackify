import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus, AlertTriangle, ChevronDown, ChevronUp, Calendar, Flag, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTags } from '@/hooks/useTags';
import { useBoard } from '@/hooks/useBoard';
import { createTag, updateTag, deleteTag } from '@/lib/tagOperations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Tag, Task } from '@/types/task';
import { format } from 'date-fns';
import { TagInput } from './TagInput';

export function TagManagement() {
  const { user } = useAuthStore();
  const { tags, loadTags } = useTags(user?.id);
  const { board } = useBoard(user?.id);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  
  // Search state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'AND' | 'OR'>('AND');

  // Get all tasks from the board that haven't been archived
  const allTasks = useMemo(() => 
    board?.columns.flatMap(column => column.tasks.filter(task => !task.archived_at)) || [],
    [board]
  );

  // Filter tasks based on selected tags and search mode
  const filteredTasks = useMemo(() => {
    if (selectedTags.length === 0) return [];

    return allTasks.filter(task => {
      const taskTags = task.tags?.map(tag => tag.name) || [];
      
      if (searchMode === 'AND') {
        // Task must have ALL selected tags
        return selectedTags.every(tag => taskTags.includes(tag));
      } else {
        // Task must have ANY of the selected tags
        return selectedTags.some(tag => taskTags.includes(tag));
      }
    });
  }, [allTasks, selectedTags, searchMode]);

  // Get tasks for a specific tag
  const getTasksForTag = (tagName: string): Task[] => {
    return allTasks.filter(task => 
      task.tags?.some(tag => tag.name === tagName)
    );
  };

  const handleCreate = async () => {
    if (!user || !tagName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await createTag(user.id, tagName.trim());
      await loadTags();
      setIsCreating(false);
      setTagName('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user || !editingTag || !tagName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await updateTag(user.id, editingTag.id, tagName.trim());
      await loadTags();
      setEditingTag(null);
      setTagName('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !tagToDelete) return;

    try {
      setIsLoading(true);
      setError(null);
      await deleteTag(user.id, tagToDelete.id);
      await loadTags();
      setTagToDelete(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setExpandedTag(expandedTag === tagId ? null : tagId);
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'To Do':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityStyles = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-700';
      case 2:
        return 'bg-orange-100 text-orange-700';
      case 3:
        return 'bg-yellow-100 text-yellow-700';
      case 4:
        return 'bg-blue-100 text-blue-700';
      case 5:
        return 'bg-green-100 text-green-700';
      default:
        return '';
    }
  };

  const renderTask = (task: Task) => (
    <div key={task.id} className="p-4 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{task.title}</p>
            {task.priority < 99999 && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(task.priority)}`}>
                <Flag className="w-3 h-3" />
                P{task.priority}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
              {task.status}
            </span>
            {task.deadline && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.deadline), 'MMM d, yyyy')}
              </span>
            )}
            {task.tags?.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tags</h2>
        <Button
          onClick={() => {
            setTagName('');
            setError(null);
            setIsCreating(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Tag
        </Button>
      </div>

      {/* Search Section */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium">Search Tasks by Tags</h3>
        </div>
        
        <div className="space-y-4">
          <TagInput
            tags={selectedTags}
            onTagsChange={setSelectedTags}
            suggestions={tags.map(tag => tag.name)}
          />
          
          <div className="flex items-center gap-4">
            <Button
              variant={searchMode === 'AND' ? 'default' : 'outline'}
              onClick={() => setSearchMode('AND')}
              size="sm"
            >
              Match All Tags
            </Button>
            <Button
              variant={searchMode === 'OR' ? 'default' : 'outline'}
              onClick={() => setSearchMode('OR')}
              size="sm"
            >
              Match Any Tag
            </Button>
          </div>

          {selectedTags.length > 0 && (
            <div className="bg-muted/50 rounded-lg divide-y">
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} matching{' '}
                  {selectedTags.length === 1 ? 'tag' : 'tags'}:{' '}
                  {selectedTags.join(searchMode === 'AND' ? ' AND ' : ' OR ')}
                </p>
              </div>
              {filteredTasks.map(renderTask)}
            </div>
          )}
        </div>
      </div>

      {/* Tags List */}
      <div className="grid gap-4">
        {tags.map(tag => {
          const tagTasks = getTasksForTag(tag.name);
          const isExpanded = expandedTag === tag.id;
          
          return (
            <div
              key={tag.id}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {tagTasks.length} task{tagTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTag(tag.id)}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTagName(tag.name);
                      setError(null);
                      setEditingTag(tag);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTagToDelete(tag)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isExpanded && tagTasks.length > 0 && (
                <div className="border-t divide-y">
                  {tagTasks.map(renderTask)}
                </div>
              )}
            </div>
          );
        })}

        {tags.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tags yet. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreating || !!editingTag}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingTag(null);
            setTagName('');
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create Tag' : 'Edit Tag'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name..."
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingTag(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreating ? handleCreate : handleUpdate}
              disabled={!tagName.trim() || isLoading}
            >
              {isLoading ? (
                isCreating ? 'Creating...' : 'Saving...'
              ) : (
                isCreating ? 'Create Tag' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Tag
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tagToDelete?.name}"? Tasks using this tag will have it removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Tag'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}