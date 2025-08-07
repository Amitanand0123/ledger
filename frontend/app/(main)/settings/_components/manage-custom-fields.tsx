'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCustomFieldsQuery, useDeleteCustomFieldMutation } from '@/lib/redux/slices/customFieldsApiSlice';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CustomFieldFormModal } from './custom-field-form-modal';
import { toast } from 'sonner';

export function ManageCustomFields() {
    const { data: customFields, isLoading } = useGetCustomFieldsQuery();
    const [deleteCustomField] = useDeleteCustomFieldMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the "${name}" field? This will remove all associated data from your job applications.`)) {
            toast.promise(deleteCustomField(id).unwrap(), {
                loading: 'Deleting field...',
                success: `Field "${name}" deleted.`,
                error: 'Failed to delete field.',
            });
        }
    };

    return (
        <>
            <CustomFieldFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <Card className="border-t-4 border-brand-accent-light">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Custom Fields</CardTitle>
                            <CardDescription>Add or remove custom fields from your job applications.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="animate-spin text-brand-primary" /> : (
                        <div className="space-y-2">
                            {customFields && customFields.length > 0 ? customFields.map(field => (
                                <div key={field.id} className="flex justify-between items-center p-3 border rounded-md bg-white dark:bg-slate-800">
                                    <div>
                                        <p className="font-medium">{field.name}</p>
                                        <p className="text-xs text-muted-foreground">{field.type}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(field.id, field.name)}>
                                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center py-4">No custom fields created yet.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}