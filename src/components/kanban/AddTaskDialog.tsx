import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Task, Category } from '@/types/task';
import { TagInput } from '../TagInput';
import { format, parse, isValid } from 'date-fns';

interface AddTaskDialogProps {
  columnId: string;
  onAdd: (columnId: string, taskData: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  categories: Category[];
  defaultCategory?: string | null;
}

export function AddTaskDialog({
  columnId,
  onAdd,
  onCancel,
  categories,
  defaultCategory
}: AddTaskDialogProps) {
  // Get today's date at 23:59
  const today = new Date();
  today.setHours(23, 59, 0, 0);
  const defaultDeadline = format(today, "yyyy-MM-dd'T'HH:mm");

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    deadline: defaultDeadline,
    category: defaultCategory || '',
    newCategory: '',
    tags: [] as string[]
  });
  const [customCategory, setCustomCategory] = useState(false);

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
    
    // Ensure the deadline is in ISO format for consistency
    let deadline = taskForm.deadline;
    if (deadline) {
      const date = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(date)) {
        deadline = date.toISOString();
      }
    }

    await onAdd(columnId, {
      title: taskForm.title,
      description: taskForm.description || null,
      deadline: deadline || null,
      category: category || null,
      tags: taskForm.tags
    });
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
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={taskForm.deadline}
              onChange={handleDeadlineChange}
            />
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
            )}
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput
              tags={taskForm.tags}
              onTagsChange={(tags) => setTaskForm({ ...taskForm, tags })}
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