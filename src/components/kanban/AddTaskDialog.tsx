import React, { useState } from 'react';
import { X, Calendar, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Task, Category, availableColors, CategoryColor } from '@/types/task';
import { TagInput } from '../TagInput';
import { format, parse, isValid } from 'date-fns';
import { useTags } from '@/hooks/useTags';
import { useAuthStore } from '@/store/authStore';

interface AddTaskDialogProps {
  columnId: string;
  onAdd: (columnId: string, taskData: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  categories: Category[];
  defaultCategory?: string | null;
  onCategoriesChange?: () => void;
}

export function AddTaskDialog({
  columnId,
  onAdd,
  onCancel,
  categories,
  defaultCategory,
  onCategoriesChange
}: AddTaskDialogProps) {
  const { user } = useAuthStore();
  const [hasDeadline, setHasDeadline] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);
  const { tags: allTags } = useTags(user?.id);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    category: defaultCategory || '',
    newCategory: '',
    newCategoryColor: 'blue' as CategoryColor,
    tags: [] as string[],
    priority: 99999
  });

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
      setTaskForm({ ...taskForm, deadline });
    }
  };

  const handleSubmit = async () => {
    const category = customCategory ? taskForm.newCategory : taskForm.category;
    
    // Only include deadline if hasDeadline is true
    let deadline = hasDeadline ? taskForm.deadline : undefined;
    if (deadline) {
      const date = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(date)) {
        deadline = date.toISOString();
      }
    }

    await onAdd(columnId, {
      title: taskForm.title,
      description: taskForm.description || undefined,
      deadline: deadline,
      category: category || undefined,
      categoryColor: customCategory ? taskForm.newCategoryColor : undefined,
      tags: taskForm.tags.map(tag => ({ id: '', name: tag, user_id: '', created_at: '' })),
      priority: taskForm.priority
    });

    // If a new category was created and onCategoriesChange is provided, call it
    if (customCategory && taskForm.newCategory && onCategoriesChange) {
      onCategoriesChange();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Task title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Task description..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={taskForm.priority.toString()}
              onValueChange={(value) => setTaskForm({ ...taskForm, priority: parseInt(value) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="99999">No Priority</SelectItem>
                {[1, 2, 3, 4, 5].map((p) => (
                  <SelectItem key={p} value={p.toString()}>
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Priority {p}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadline">Deadline</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHasDeadline(!hasDeadline)}
                className="h-8 px-2 text-muted-foreground"
              >
                {hasDeadline ? 'Remove' : 'Add'} Deadline
              </Button>
            </div>
            {hasDeadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={handleDeadlineChange}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            {!customCategory ? (
              <div className="flex gap-2">
                <Select
                  value={taskForm.category}
                  onValueChange={(value) => setTaskForm({ ...taskForm, category: value })}
                >
                  <SelectTrigger className="w-full">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomCategory(true)}
                >
                  New
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={taskForm.newCategory}
                    onChange={(e) => setTaskForm({ ...taskForm, newCategory: e.target.value })}
                    placeholder="New category..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCustomCategory(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 items-center">
                  <Label htmlFor="categoryColor" className="shrink-0">Color:</Label>
                  <Select
                    value={taskForm.newCategoryColor}
                    onValueChange={(value) => setTaskForm({ ...taskForm, newCategoryColor: value as CategoryColor })}
                  >
                    <SelectTrigger id="categoryColor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full bg-${color}-100 border border-${color}-200`} />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput
              tags={taskForm.tags}
              onTagsChange={(tags) => setTaskForm({ ...taskForm, tags })}
              suggestions={allTags.map(tag => tag.name)}
              placeholder="Add tags..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!taskForm.title.trim() || (!taskForm.category && !taskForm.newCategory)}
          >
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}