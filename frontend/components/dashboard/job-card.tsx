'use client'; 

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JobApplication } from '@/lib/types';
import { Button } from '../ui/button';
import { Edit, Trash2, GripVertical, MoreHorizontal, Link as LinkIcon, Briefcase, FileText, MapPin, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setEditingJob, openJobFormModal, openDescriptionModal, openInterviewModal, openOfferModal } from '@/lib/redux/slices/uiSlice';
import { useDeleteJobMutation, useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';
import { StatusCombobox } from './status-combobox'; 
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { deleteGuestJob, updateGuestJob } from '@/lib/redux/slices/guestJobsSlice';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TruncatedText } from '../ui/truncated-text';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useGetDocumentsQuery } from '@/lib/redux/slices/documentApiSlice';
import { UserDocument } from '@/lib/types';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { differenceInDays } from 'date-fns';

interface JobCardProps {
    job: JobApplication;
    isOverlay?: boolean;
    colorClass: string;
    isSelected: boolean;
    onSelectionChange: (jobId: string, isSelected: boolean) => void;
}

function DocumentSelector({ job, type }: { job: JobApplication, type: 'RESUME' | 'COVER_LETTER' }) {
    const { data: documents, isLoading } = useGetDocumentsQuery(type);
    const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
    const [isOpen, setIsOpen] = useState(false);

    const currentDoc = type === 'RESUME' ? job.resume : job.coverLetter;

    const handleSelect = (docId: string) => {
        const fieldToUpdate = type === 'RESUME' ? 'resumeId' : 'coverLetterId';
        const newId = docId === 'none' ? null : docId;
        
        if ((currentDoc?.id || null) === newId) return;

        toast.promise(updateJob({ id: job.id, [fieldToUpdate]: newId }).unwrap(), {
            loading: `Updating ${type.toLowerCase()}...`,
            success: `${type.charAt(0) + type.slice(1).toLowerCase()} updated!`,
            error: 'Failed to update.',
        });
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className='flex items-center gap-1 cursor-pointer hover:text-primary'>
                    <FileText size={14}/>
                    <TruncatedText text={currentDoc?.filename || 'N/A'} maxLength={15}/>
                </div>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-60">
                <Select onValueChange={handleSelect} defaultValue={currentDoc?.id || 'none'}>
                    <SelectTrigger disabled={isLoading || isUpdating}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : <SelectValue placeholder={`Select ${type.toLowerCase()}`} />}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {documents?.map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>{doc.filename}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </PopoverContent>
        </Popover>
    );
}

export function JobCard({ job, isOverlay, colorClass, isSelected, onSelectionChange }: JobCardProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { data: session } = useSession();
    const isGuest = !session;

    const [deleteJobApi] = useDeleteJobMutation();
    const [updateJobApi] = useUpdateJobMutation();

    // Check for upcoming interviews
    const now = new Date();
    const upcomingInterviews = job.interviews?.filter(
        interview => !interview.completed && new Date(interview.scheduledAt) > now,
    ) || [];
    const hasUpcomingInterviews = upcomingInterviews.length > 0;

    // Check for approaching deadline
    const hasDeadline = !!job.deadline;
    const daysUntilDeadline = hasDeadline ? differenceInDays(new Date(job.deadline!), now) : null;
    const isDeadlineApproaching = hasDeadline && daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7;

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: job.id, data: { type: 'Job', job },
    });

    const style = { transition, transform: CSS.Transform.toString(transform) };

    const handleEdit = () => { dispatch(setEditingJob(job)); dispatch(openJobFormModal()); };
    const handleViewDetails = () => { router.push(`/jobs/${job.id}`); };
    const handleOpenDescriptionModal = () => dispatch(openDescriptionModal(job));

    const handleDelete = () => {
        toast.warning(`Delete application for ${job.position}?`, {
            action: { label: 'Delete', onClick: () => {
                if (isGuest) {
                    dispatch(deleteGuestJob(job.id));
                    toast.success('Demo job deleted.');
                } else {
                    toast.promise(deleteJobApi(job.id).unwrap(), {
                        loading: 'Deleting...', success: 'Application deleted.', error: 'Failed to delete.',
                    });
                }
            }},
        });
    };

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === job.status) return;
        if (isGuest) {
            dispatch(updateGuestJob({ id: job.id, status: newStatus }));
            toast.info('Status updated for demo job.');
        } else if (newStatus === 'INTERVIEW') {
            dispatch(openInterviewModal(job));
        } else if (newStatus === 'OFFER') {
            dispatch(openOfferModal(job));
        } else {
            toast.promise(updateJobApi({ id: job.id, status: newStatus }).unwrap(), {
                loading: 'Updating status...', success: 'Status updated', error: 'Failed to update.',
            });
        }
    };
    
    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="bg-card p-4 rounded-lg border-2 border-primary opacity-50 h-[60px] w-full" />;
    }
    
    const renderCell = (content: React.ReactNode, className: string = '', onClick?: (event: React.MouseEvent) => void) => (
        <div className={`flex items-center p-2 min-w-0 text-sm text-muted-foreground ${className} ${onClick ? 'cursor-pointer' : ''}`}
             onClick={onClick}>
            <span className="truncate">{content}</span>
        </div>
    );

    return (
        <div ref={setNodeRef} style={style} className={`touch-none w-full border rounded-lg transition-shadow duration-200 ${isOverlay ? 'shadow-2xl z-50' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${colorClass}`}>
            <div className="grid items-center gap-x-4 cursor-default
                            grid-cols-[auto_40px_1.5fr_1fr_40px]
                            md:grid-cols-[auto_40px_minmax(120px,1.2fr)_minmax(120px,1.2fr)_160px_minmax(100px,1fr)_100px_100px_100px_1fr_1fr_1fr_40px]">
                
                <div className="flex items-center pl-2"><Checkbox checked={isSelected} onCheckedChange={(c) => onSelectionChange(job.id, !!c)} onClick={(e) => e.stopPropagation()}/></div>
                <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"><GripVertical size={18} /></button>

                <div className="p-2 col-span-1 text-left cursor-pointer" onClick={handleViewDetails}>
                    <p className="font-semibold truncate text-foreground">{job.company}</p>
                    <p className="truncate text-muted-foreground md:hidden">{job.position}</p>
                    <div className="flex gap-1 mt-1">
                        {hasUpcomingInterviews && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
                                <Calendar size={10} />
                                <span>{upcomingInterviews.length}</span>
                            </Badge>
                        )}
                        {isDeadlineApproaching && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1">
                                <AlertCircle size={10} />
                                <span>{daysUntilDeadline}d</span>
                            </Badge>
                        )}
                    </div>
                </div>
                {renderCell(<TruncatedText text={job.position} maxLength={25} />, 'hidden md:flex text-left', handleViewDetails)}
                {renderCell(<StatusCombobox currentStatus={job.status} onStatusChange={handleStatusChange} />, '', (e) => e.stopPropagation())}
                {renderCell(<div className='flex items-center gap-1'><MapPin size={14}/><TruncatedText text={job.location} maxLength={15}/></div>, 'hidden md:flex', handleViewDetails)}
                {renderCell(<span>{formatDate(job.applicationDate)}</span>, 'hidden md:flex', handleViewDetails)}
                {renderCell(<TruncatedText text={job.platform?.name} maxLength={15}/>, 'hidden md:flex', handleViewDetails)}
                {renderCell(job.url ? <a href={job.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary"><LinkIcon size={14}/> Link</a> : <span className="text-muted-foreground">N/A</span>, 'hidden md:flex')}
                {renderCell(<TruncatedText text={job.description} maxLength={30}/>, 'hidden md:flex hover:text-primary', handleOpenDescriptionModal)}
                {renderCell(<DocumentSelector job={job} type="RESUME" />, 'hidden md:flex')}
                {renderCell(<DocumentSelector job={job} type="COVER_LETTER" />, 'hidden md:flex')}

                <div className="flex justify-end pr-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={18} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleViewDetails}><Briefcase className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            {job.url && (<DropdownMenuItem asChild><a href={job.url} target="_blank" rel="noopener noreferrer"><LinkIcon className="mr-2 h-4 w-4"/> View Listing</a></DropdownMenuItem>)}
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}