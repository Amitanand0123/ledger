'use client'; 

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JobApplication } from '@/lib/types';
import { Button } from '../ui/button';
import { Edit, Trash2, GripVertical, MoreHorizontal, Link as LinkIcon, Briefcase, FileText, MapPin } from 'lucide-react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { openJobDetailsModal, setEditingJob, openJobFormModal, setViewingJob, openDescriptionModal } from '@/lib/redux/slices/uiSlice';
import { useDeleteJobMutation, useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';
import { StatusCombobox } from './status-combobox'; 
import { useSession } from 'next-auth/react';
import { deleteGuestJob, updateGuestJob } from '@/lib/redux/slices/guestJobsSlice';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TruncatedText } from '../ui/truncated-text';

interface JobCardProps {
    job: JobApplication;
    isOverlay?: boolean;
    colorClass: string;
    isSelected: boolean;
    onSelectionChange: (jobId: string, isSelected: boolean) => void;
}

export function JobCard({ job, isOverlay, colorClass, isSelected, onSelectionChange }: JobCardProps) {
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const isGuest = !session;

    const [deleteJobApi] = useDeleteJobMutation();
    const [updateJobApi] = useUpdateJobMutation();

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: job.id, data: { type: 'Job', job },
    });

    const style = { transition, transform: CSS.Transform.toString(transform) };

    const handleEdit = () => { dispatch(setEditingJob(job)); dispatch(openJobFormModal()); };
    const handleViewDetails = () => { dispatch(setViewingJob(job)); dispatch(openJobDetailsModal()); };
    const handleOpenDescriptionModal = () => dispatch(openDescriptionModal(job));

    const handleDelete = () => {
        toast.warning(`Delete application for ${job.position}?`, {
            action: { label: 'Delete', onClick: () => {
                if (isGuest) {
                    dispatch(deleteGuestJob(job.id));
                    toast.success("Demo job deleted.");
                } else {
                    toast.promise(deleteJobApi(job.id).unwrap(), {
                        loading: 'Deleting...', success: `Application deleted.`, error: 'Failed to delete.'
                    });
                }
            }},
        });
    };

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === job.status) return;
        if (isGuest) {
            dispatch(updateGuestJob({ id: job.id, status: newStatus }));
            toast.info("Status updated for demo job.");
        } else {
            toast.promise(updateJobApi({ id: job.id, status: newStatus }).unwrap(), {
                loading: 'Updating status...', success: `Status updated`, error: 'Failed to update.'
            });
        }
    };
    
    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="bg-card p-4 rounded-lg border-2 border-primary opacity-50 h-[60px] w-full" />;
    }
    
    // FIXED: Corrected the onClick handler type to accept a MouseEvent
    const renderCell = (content: React.ReactNode, className: string = '', onClick?: (event: React.MouseEvent) => void) => (
        <div className={`flex items-center justify-center p-2 truncate text-sm text-muted-foreground ${className} ${onClick ? 'cursor-pointer' : ''}`}
             onClick={onClick}>
            {content}
        </div>
    );

    return (
        <div ref={setNodeRef} style={style} className={`touch-none w-full border rounded-lg transition-shadow duration-200 ${isOverlay ? 'shadow-2xl z-50' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${colorClass}`}>
            <div className="grid items-center gap-x-4 cursor-default text-center
                            grid-cols-[auto_40px_1.5fr_1fr_40px]
                            md:grid-cols-[auto_40px_minmax(120px,1.2fr)_minmax(120px,1.2fr)_130px_minmax(100px,1fr)_100px_100px_100px_1fr_1fr_1fr_40px]">
                
                <div className="flex items-center pl-2"><Checkbox checked={isSelected} onCheckedChange={(c) => onSelectionChange(job.id, !!c)} onClick={(e) => e.stopPropagation()}/></div>
                <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"><GripVertical size={18} /></button>

                {/* --- Columns in specified order --- */}
                <div className="p-2 col-span-1 text-left cursor-pointer" onClick={handleViewDetails}>
                    <p className="font-semibold truncate text-foreground">{job.company}</p>
                    <p className="truncate text-muted-foreground md:hidden">{job.position}</p>
                </div>
                {renderCell(<TruncatedText text={job.position} maxLength={25} />, "hidden md:flex text-left", handleViewDetails)}
                {/* FIXED: The onClick handler now correctly matches the expected signature */}
                {renderCell(<StatusCombobox currentStatus={job.status} onStatusChange={handleStatusChange} />, "", (e) => e.stopPropagation())}
                {renderCell(<div className='flex items-center gap-1'><MapPin size={14}/><TruncatedText text={job.location} maxLength={15}/></div>, "hidden md:flex", handleViewDetails)}
                {renderCell(<span>{new Date(job.applicationDate).toLocaleDateString()}</span>, "hidden md:flex", handleViewDetails)}
                {renderCell(<TruncatedText text={job.platform?.name} maxLength={15}/>, "hidden md:flex", handleViewDetails)}
                {renderCell(job.url ? <a href={job.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-primary"><LinkIcon size={14}/> Link</a> : <span className="text-muted-foreground">N/A</span>, "hidden md:flex")}
                {renderCell(<TruncatedText text={job.description} maxLength={30}/>, "hidden md:flex hover:text-primary", handleOpenDescriptionModal)}
                {renderCell(<div className='flex items-center gap-1'><FileText size={14}/><TruncatedText text={job.resume?.filename} maxLength={15}/></div>, "hidden md:flex", handleViewDetails)}
                {renderCell(<div className='flex items-center gap-1'><FileText size={14}/><TruncatedText text={job.coverLetter?.filename} maxLength={15}/></div>, "hidden md:flex", handleViewDetails)}

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