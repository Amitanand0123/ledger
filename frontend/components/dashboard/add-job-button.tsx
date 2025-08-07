'use client';

import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/lib/redux/hooks';
import { openJobFormModal, setEditingJob } from '@/lib/redux/slices/uiSlice';
import { PlusCircle } from 'lucide-react';

export function AddJobButton() {
    const dispatch = useAppDispatch();

    const handleClick = () => {
        dispatch(setEditingJob(null)); // Ensure we're not in edit mode
        dispatch(openJobFormModal());
    };

    return (
        <Button 
            onClick={handleClick}
        >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Job
        </Button>
    );
}