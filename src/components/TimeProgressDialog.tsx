import { useState, useEffect } from 'react';
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
    start_hour: 6,
    start_minute: 0,
    end_date: format(new Date(), 'yyyy-MM-dd'),
    end_hour: 6,
    end_minute: 0
  });

  useEffect(() => {
    if (editingProgress) {
      setFormData({
        title: editingProgress.title,
        start_date: format(new Date(editingProgress.start_date), 'yyyy-MM-dd'),
        start_hour: editingProgress.start_hour,
        start_minute: editingProgress.start_minute,
        end_date: format(new Date(editingProgress.end_date), 'yyyy-MM-dd'),
        end_hour: editingProgress.end_hour,
        end_minute: editingProgress.end_minute
      });
    } else {
      setFormData({
        title: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        start_hour: 6,
        start_minute: 0,
        end_date: format(new Date(), 'yyyy-MM-dd'),
        end_hour: 6,
        end_minute: 0
      });
    }
  }, [editingProgress]);

  const handleSubmit = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(formData.start_date);
      startDate.setHours(formData.start_hour, formData.start_minute, 0, 0);

      const endDate = new Date(formData.end_date);
      endDate.setHours(formData.end_hour, formData.end_minute, 0, 0);
      
      if (editingProgress) {
        await updateTimeProgress(
          user.id,
          editingProgress.id,
          {
            title: formData.title,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            start_hour: formData.start_hour,
            start_minute: formData.start_minute,
            end_hour: formData.end_hour,
            end_minute: formData.end_minute
          }
        );
      } else {
        await createTimeProgress(
          user.id,
          {
            title: formData.title,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            start_hour: formData.start_hour,
            start_minute: formData.start_minute,
            end_hour: formData.end_hour,
            end_minute: formData.end_minute
          }
        );
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving time progress:', err);
      setError('Failed to save time progress');
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
            <Label>Start Time</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
              <Input
                type="number"
                min="0"
                max="23"
                value={formData.start_hour}
                onChange={(e) => setFormData({ ...formData, start_hour: parseInt(e.target.value) })}
                placeholder="Hour (0-23)"
              />
              <Input
                type="number"
                min="0"
                max="59"
                value={formData.start_minute}
                onChange={(e) => setFormData({ ...formData, start_minute: parseInt(e.target.value) })}
                placeholder="Minute (0-59)"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>End Time</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
              <Input
                type="number"
                min="0"
                max="23"
                value={formData.end_hour}
                onChange={(e) => setFormData({ ...formData, end_hour: parseInt(e.target.value) })}
                placeholder="Hour (0-23)"
              />
              <Input
                type="number"
                min="0"
                max="59"
                value={formData.end_minute}
                onChange={(e) => setFormData({ ...formData, end_minute: parseInt(e.target.value) })}
                placeholder="Minute (0-59)"
              />
            </div>
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