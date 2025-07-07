'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeJobFormModal } from '@/lib/redux/slices/uiSlice';
import { jobFormSchema } from '@/lib/validations';
import { useAddJobMutation, useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { useEffect } from 'react';
import { JobApplication } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { addGuestJob } from '@/lib/redux/slices/guestJobsSlice';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PlatformCombobox } from './platform-combobox';
import { useGetDocumentsQuery } from '@/lib/redux/slices/documentApiSlice';
import { FileText, Loader2 } from 'lucide-react';
import { StatusCombobox } from './status-combobox';

type JobFormValues = z.infer<typeof jobFormSchema>;

export function JobFormModal() {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const isGuest = status === 'unauthenticated';

  const { isJobFormModalOpen, editingJob } = useAppSelector((state) => state.ui);
  const [addJob, { isLoading: isAdding }] = useAddJobMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();

  const { data: resumes, isLoading: isLoadingResumes } = useGetDocumentsQuery('RESUME', { skip: isGuest });
  const { data: coverLetters, isLoading: isLoadingCoverLetters } = useGetDocumentsQuery('COVER_LETTER', { skip: isGuest });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      company: '', position: '', location: '', salary: '', url: '',
      description: '', status: 'PENDING', platformName: '',
      resumeId: undefined, coverLetterId: undefined,
    }
  });

  useEffect(() => {
    if (editingJob) {
      reset({
        company: editingJob.company || '', position: editingJob.position || '',
        location: editingJob.location || '', salary: editingJob.salary || '',
        url: editingJob.url || '', description: editingJob.description || '',
        status: editingJob.status || 'PENDING', platformName: editingJob.platform?.name || '',
        resumeId: editingJob.resumeId || undefined, coverLetterId: editingJob.coverLetterId || undefined,
      });
    } else {
      reset({
        company: '', position: '', location: '', salary: '', url: '',
        description: '', status: 'PENDING', platformName: '',
        resumeId: undefined, coverLetterId: undefined,
      });
    }
  }, [editingJob, reset]);
  
  const handleClose = () => dispatch(closeJobFormModal());

  const onSubmit = async (data: JobFormValues) => {
    if (isGuest) {
      dispatch(addGuestJob(data as any));
      toast.success("Demo job added!");
      handleClose();
      return;
    }

    const promise = editingJob 
      ? updateJob({ id: editingJob.id, ...data }).unwrap()
      : addJob(data).unwrap();

    toast.promise(promise, {
      loading: editingJob ? 'Updating application...' : 'Saving application...',
      success: (result) => {
        handleClose();
        return `Application for ${result.company} has been ${editingJob ? 'updated' : 'saved'}!`;
      },
      error: (err) => err.data?.message || 'An error occurred. Please try again.'
    });
  };

  return (
    <Dialog open={isJobFormModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingJob ? 'Edit' : 'Add New'} Job Application</DialogTitle>
          <DialogDescription>{editingJob ? 'Update the details for this application.' : 'Fill in the details to track a new job.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="company">Company</Label><Input id="company" {...register('company')} />{errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}</div>
                <div><Label htmlFor="position">Position / Role</Label><Input id="position" {...register('position')} />{errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}</div>
            </div>
            
            <div><Label htmlFor="location">Location</Label><Input id="location" {...register('location')} placeholder="e.g., San Francisco, CA or Remote" />{errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="salary">Salary / Stipend</Label><Input id="salary" {...register('salary')} placeholder="e.g., $120,000/year" /></div>
                <div>
                  <Label htmlFor="platformName">Platform</Label>
                  <Controller
                    control={control}
                    name="platformName"
                    render={({ field }) => (
                      <PlatformCombobox
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
            </div>
            
            <div><Label htmlFor="status">Status</Label><Controller control={control} name="status" render={({ field }) => <StatusCombobox currentStatus={field.value} onStatusChange={field.onChange} />} />{errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}</div>
            <div><Label htmlFor="url">Job Listing Link</Label><Input id="url" {...register('url')} type="url" />{errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}</div>
            <div><Label htmlFor="description">Job Description</Label><Textarea id="description" {...register('description')} /></div>

            <div className="space-y-4 rounded-md border p-4">
                <h4 className="text-sm font-medium">Documents</h4>
                <div><Label>Resume</Label><Controller name="resumeId" control={control} render={({ field }) => (<Select onValueChange={(v) => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}><SelectTrigger disabled={isLoadingResumes}>{isLoadingResumes ? <Loader2 className="h-4 w-4 animate-spin"/> : <SelectValue placeholder="Select a resume" />}</SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{resumes?.map(d => <SelectItem key={d.id} value={d.id}><FileText className="inline-block mr-2 h-4 w-4"/>{d.filename}</SelectItem>)}</SelectContent></Select>)} /></div>
                <div><Label>Cover Letter</Label><Controller name="coverLetterId" control={control} render={({ field }) => (<Select onValueChange={(v) => field.onChange(v === 'none' ? null : v)} value={field.value ?? 'none'}><SelectTrigger disabled={isLoadingCoverLetters}>{isLoadingCoverLetters ? <Loader2 className="h-4 w-4 animate-spin"/> : <SelectValue placeholder="Select a cover letter" />}</SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{coverLetters?.map(d => <SelectItem key={d.id} value={d.id}><FileText className="inline-block mr-2 h-4 w-4"/>{d.filename}</SelectItem>)}</SelectContent></Select>)} /></div>
                <p className="text-xs text-muted-foreground">Upload and manage documents in <a href="/settings" className="underline">Settings</a>.</p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isAdding || isUpdating}>
                {(isAdding || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAdding || isUpdating ? 'Saving...' : 'Save Application'}
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}