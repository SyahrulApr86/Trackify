import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuthStore } from '@/store/authStore';
import { createTimeProgress, updateTimeProgress } from '@/lib/timeProgressOperations';
import { TimeProgressWithProgress } from '@/types/timeProgress';

interface TimeProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingProgress?: TimeProgressWithProgress | null;
}

export function TimeProgressDialog({
  open,
  onOpenChange,
  onSuccess,
  editingProgress
}: TimeProgressDialogProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (editingProgress) {
      setFormData({
        title: editingProgress.title,
        start_date: format(new Date(editingProgress.start_date), 'yyyy-MM-dd'),
        end_date: format(new Date(editingProgress.end_date), 'yyyy-MM-dd')
      });
    } else {
      setFormData({
        title: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [editingProgress]);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      if (editingProgress) {
        await updateTimeProgress(user.id, editingProgress.id, formData);
      } else {
        await createTimeProgress(user.id, formData);
      }
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingProgress ? 'Edit Progress Item' : 'Add Time Progress'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Semester Progress, Project Timeline"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.start_date || !formData.end_date}
          >
            {loading ? (editingProgress ? 'Saving...' : 'Adding...') : (editingProgress ? 'Save Changes' : 'Add Progress')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}