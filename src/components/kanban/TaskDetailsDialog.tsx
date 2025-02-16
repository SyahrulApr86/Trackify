import React, { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar, Clock, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Task, Category, Tag } from '@/types/task';
import { TagInput } from '../TagInput';
import { useAuthStore } from '@/store/authStore';
import { getTaskTags } from '@/lib/tagOperations';
import { useTags } from '@/hooks/useTags';

interface TaskDetailsDialogProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onArchive?: (taskId: string) => Promise<void>;
  categories: Category[];
}

export function TaskDetailsDialog({
  task,
  onClose,
  onUpdate,
  onArchive,
  categories
}: TaskDetailsDialogProps) {
  const { user } = useAuthStore();
  const { tags: allTags } = useTags(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : '',
    category: task.category || '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTaskTags = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const tags = await getTaskTags(user.id, task.id);
        setFormData(prev => ({
          ...prev,
          tags: tags.map(tag => tag.name)
        }));
      } catch (error) {
        console.error('Error loading task tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTaskTags();
  }, [task.id, user]);

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let deadline = value;

    // If only date is selected (no time), add 23:59
    if (value && value.length === 10) {
      deadline = `${value}T23:59`;
    }
    
    // Validate the date
    const date = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
    if (isValid(date)) {
      setFormData({ ...formData, deadline });
    }
  };

  const handleSave = async () => {
    // Ensure the deadline is in ISO format for consistency
    let deadline = formData.deadline;
    if (deadline) {
      const date = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(date)) {
        deadline = date.toISOString();
      }
    }

    await onUpdate(task.id, {
      ...formData,
      deadline: deadline || null
    });
    setIsEditing(false);
  };

  const handleArchive = async () => {
    if (onArchive) {
      await onArchive(task.id);
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task' : 'Task Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={handleDeadlineChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput
                  tags={formData.tags}
                  onTagsChange={(tags) => setFormData({ ...formData, tags })}
                  suggestions={allTags.map(tag => tag.name)}
                  placeholder="Add tags..."
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{task.title}</h3>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{task.description || 'No description provided'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${task.status === 'Done' ? 'bg-green-100 text-green-700' :
                      task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              {task.category && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Category</Label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${task.category === 'Urgent' ? 'bg-red-100 text-red-700' :
                        task.category === 'Work' ? 'bg-blue-100 text-blue-700' :
                        task.category === 'Personal' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {task.category}
                    </span>
                  </div>
                </div>
              )}

              {!loading && formData.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.deadline && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Deadline</Label>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(task.deadline), 'HH:mm')}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-sm">{format(new Date(task.created_at), 'MMM d, yyyy HH:mm')}</p>
              </div>

              {task.completed_at && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Completed</Label>
                  <p className="text-sm">{format(new Date(task.completed_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Task
                </Button>
                {onArchive && !task.archived_at && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleArchive}
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}