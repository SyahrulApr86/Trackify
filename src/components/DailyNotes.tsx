import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types/note';
import { createNote, updateNote, deleteNote } from '@/lib/noteOperations';
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

export function DailyNotes() {
  const { user } = useAuthStore();
  const { notes, loadNotes } = useNotes(user?.id);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleCreate = async () => {
    if (!user) return;

    try {
      await createNote(user.id, {
        title: formData.title || format(new Date(formData.date), 'MMMM d, yyyy'),
        content: formData.content,
        date: formData.date
      });
      await loadNotes();
      setIsCreating(false);
      setFormData({
        title: '',
        content: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdate = async () => {
    if (!user || !editingNote) return;

    try {
      await updateNote(user.id, editingNote.id, {
        title: formData.title,
        content: formData.content,
        date: formData.date
      });
      await loadNotes();
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDelete = async () => {
    if (!user || !noteToDelete) return;

    try {
      await deleteNote(user.id, noteToDelete.id);
      await loadNotes();
      setNoteToDelete(null);
      setViewingNote(null);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setViewingNote(null);
    setFormData({
      title: note.title,
      content: note.content || '',
      date: note.date
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Notes</h2>
        <Button
          onClick={() => {
            setFormData({
              title: '',
              content: '',
              date: format(new Date(), 'yyyy-MM-dd')
            });
            setIsCreating(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map(note => (
          <div
            key={note.id}
            className="bg-card border rounded-lg p-4 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setViewingNote(note)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{note.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(note.date), 'MMMM d, yyyy')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(note);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoteToDelete(note);
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {note.content && (
              <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {note.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* View Note Dialog */}
      <Dialog
        open={!!viewingNote}
        onOpenChange={(open) => !open && setViewingNote(null)}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingNote?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 space-y-4 py-4 overflow-hidden">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {viewingNote && format(new Date(viewingNote.date), 'MMMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {viewingNote && format(new Date(viewingNote.created_at), 'HH:mm')}
              </div>
            </div>
            
            {viewingNote?.content && (
              <div className="bg-muted/50 rounded-lg p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
                <p className="whitespace-pre-wrap">{viewingNote.content}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setViewingNote(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => viewingNote && handleEdit(viewingNote)}
              >
                Edit Note
              </Button>
              <Button
                variant="outline"
                className="hover:bg-destructive/10 hover:text-destructive"
                onClick={() => viewingNote && setNoteToDelete(viewingNote)}
              >
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Note Dialog */}
      <Dialog
        open={isCreating || !!editingNote}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingNote(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create Note' : 'Edit Note'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 space-y-4 py-4 overflow-hidden">
            <div className="space-y-2">
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Title (optional)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 flex-1">
              <textarea
                className="w-full h-[calc(90vh-16rem)] px-4 py-3 text-base rounded-md border border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="Note content..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingNote(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreating ? handleCreate : handleUpdate}
              disabled={!formData.date}
            >
              {isCreating ? 'Create Note' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Note
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}