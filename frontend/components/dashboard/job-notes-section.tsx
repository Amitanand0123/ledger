'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Trash2, Plus, Pin, PinOff, Pencil } from 'lucide-react';
import { Note } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface JobNotesSectionProps {
  jobId: string;
  notes?: Note[];
  onUpdate: () => void;
}

export function JobNotesSection({ jobId, notes = [], onUpdate }: JobNotesSectionProps) {
  const { data: session } = useSession();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');

  const resetForm = () => {
    setContent('');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notes/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notes`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          jobId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      toast.success(editingId ? 'Note updated' : 'Note added');
      resetForm();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save note');
    }
  };

  const handleEdit = (note: Note) => {
    setContent(note.content);
    setEditingId(note.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      toast.success('Note deleted');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update note');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-foreground">Notes ({notes.length})</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <Textarea
            placeholder="Enter your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Update' : 'Add'} Note
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {notes.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notes yet. Add one to keep track of important information!
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 border rounded-lg ${
                note.isPinned
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  : 'bg-background'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {note.isPinned && (
                    <div className="flex items-center gap-1 mb-1">
                      <Pin className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-600 font-medium">Pinned</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(note.createdAt), 'PPp')}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePin(note)}
                    title={note.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    {note.isPinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(note)}
                    title="Edit note"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(note.id)}
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
