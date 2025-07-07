'use client';

import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/redux/hooks";
import { openJobFormModal, setEditingJob } from "@/lib/redux/slices/uiSlice";
import { FilePlus2, PlusCircle } from "lucide-react";

interface EmptyStateProps {
    isFiltered: boolean;
    isGuest: boolean;
}

export function EmptyState({ isFiltered, isGuest }: EmptyStateProps) {
    const dispatch = useAppDispatch();
    const handleAddJobClick = () => {
        dispatch(setEditingJob(null));
        dispatch(openJobFormModal());
    };

    const title = isFiltered ? "No Jobs Found" : "Your Job Board is Empty";
    const description = isFiltered 
        ? "Try adjusting your search or filter criteria to find what you're looking for."
        : isGuest
        ? "Welcome! Add a demo job application to see how it works. Your data won't be saved unless you sign up."
        : "Let's get started! Add your first job application to begin tracking your journey.";

    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm m-4">
            <div className="flex flex-col items-center gap-2 text-center p-6">
                <FilePlus2 className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                <p className="max-w-md text-sm text-muted-foreground">{description}</p>
                <Button className="mt-4 bg-brand-primary hover:bg-brand-secondary text-black" onClick={handleAddJobClick}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Job Application
                </Button>
            </div>
        </div>
    );
}