import React from 'react';
import { format } from 'date-fns';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTimeProgress } from '@/hooks/useTimeProgress';
import { Button } from './ui/button';
import { TimeProgressDialog } from './TimeProgressDialog';
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
import { TimeProgressWithProgress } from '@/types/timeProgress';

export function TimeProgressBar() {
  const { user } = useAuthStore();
  const { progress, loading, error, loadProgress } = useTimeProgress(user?.id);
  const [showDialog, setShowDialog] = React.useState(false);
  const [editingProgress, setEditingProgress] = React.useState<TimeProgressWithProgress | null>(null);
  const [progressToDelete, setProgressToDelete] = React.useState<TimeProgressWithProgress | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
        <p className="text-destructive">{error}</p>
        <Button
          onClick={loadProgress}
          variant="outline"
          className="mt-2"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Time Progress</h2>
        <Button onClick={() => setShowDialog(true)}>Add Progress</Button>
      </div>

      <div className="space-y-6">
        {progress.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{item.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.daysRemaining} days remaining
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingProgress(item)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setProgressToDelete(item)}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{format(new Date(item.start_date), 'dd MMM yyyy')}</span>
              <span>{item.progress}% completed</span>
              <span>{format(new Date(item.end_date), 'dd MMM yyyy')}</span>
            </div>
          </div>
        ))}

        {progress.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No progress items yet. Add one to get started!</p>
          </div>
        )}
      </div>

      <TimeProgressDialog
        open={showDialog || !!editingProgress}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingProgress(null);
        }}
        onSuccess={loadProgress}
        editingProgress={editingProgress}
      />

      <AlertDialog
        open={!!progressToDelete}
        onOpenChange={(open) => !open && setProgressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Progress Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{progressToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (progressToDelete && user) {
                  try {
                    await deleteTimeProgress(user.id, progressToDelete.id);
                    await loadProgress();
                    setProgressToDelete(null);
                  } catch (error) {
                    console.error('Error deleting progress:', error);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}