'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Clock, MapPin, Trash2, Plus, CheckCircle2, Circle, Pencil } from 'lucide-react';
import { Interview, InterviewType } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface JobInterviewsSectionProps {
  jobId: string;
  interviews?: Interview[];
  onUpdate: () => void;
}

const interviewTypeLabels: Record<InterviewType, string> = {
  PHONE_SCREEN: 'Phone Screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  SYSTEM_DESIGN: 'System Design',
  CULTURAL_FIT: 'Cultural Fit',
  FINAL_ROUND: 'Final Round',
  OTHER: 'Other',
};

export function JobInterviewsSection({ jobId, interviews = [], onUpdate }: JobInterviewsSectionProps) {
  const { data: session } = useSession();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'PHONE_SCREEN' as InterviewType,
    scheduledAt: '',
    duration: '',
    location: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'PHONE_SCREEN',
      scheduledAt: '',
      duration: '',
      location: '',
      notes: '',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.scheduledAt) {
      toast.error('Please select a date and time');
      return;
    }

    const payload = {
      jobId,
      type: formData.type,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };

    try {
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/interviews/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/interviews`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save interview');
      }

      toast.success(editingId ? 'Interview updated' : 'Interview added');
      resetForm();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save interview');
    }
  };

  const handleEdit = (interview: Interview) => {
    setFormData({
      type: interview.type,
      scheduledAt: new Date(interview.scheduledAt).toISOString().slice(0, 16),
      duration: interview.duration?.toString() || '',
      location: interview.location || '',
      notes: interview.notes || '',
    });
    setEditingId(interview.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/interviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete interview');
      }

      toast.success('Interview deleted');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete interview');
    }
  };

  const handleToggleCompleted = async (interview: Interview) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/interviews/${interview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ completed: !interview.completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update interview');
      }

      toast.success(interview.completed ? 'Marked as incomplete' : 'Marked as completed');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update interview');
    }
  };

  const sortedInterviews = [...interviews].sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-foreground">Interviews ({interviews.length})</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value: InterviewType) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(interviewTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              placeholder="e.g., 60"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Location / Link</Label>
            <Input
              placeholder="e.g., Zoom link or office address"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Interviewer names, topics to prepare, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Update' : 'Add'} Interview
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {sortedInterviews.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No interviews scheduled yet
          </p>
        ) : (
          sortedInterviews.map((interview) => (
            <div
              key={interview.id}
              className={`p-3 border rounded-lg ${
                interview.completed ? 'bg-muted/50 opacity-75' : 'bg-background'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-brand-primary">
                      {interviewTypeLabels[interview.type]}
                    </span>
                    {interview.completed && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(interview.scheduledAt), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(interview.scheduledAt), 'p')}
                        {interview.duration && ` (${interview.duration} min)`}
                      </span>
                    </div>
                    {interview.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{interview.location}</span>
                      </div>
                    )}
                    {interview.notes && (
                      <p className="text-xs mt-1 italic">{interview.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleCompleted(interview)}
                    title={interview.completed ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {interview.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(interview)}
                    title="Edit interview"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(interview.id)}
                    title="Delete interview"
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
