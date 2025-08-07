'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddCustomFieldMutation } from '@/lib/redux/slices/customFieldsApiSlice';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CustomFieldFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CustomFieldFormModal({ isOpen, onClose }: CustomFieldFormModalProps) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        defaultValues: { name: '', type: 'TEXT' },
    });
    const [addCustomField, { isLoading }] = useAddCustomFieldMutation();

    const onSubmit = async (data: { name: string, type: string }) => {
        toast.promise(addCustomField(data).unwrap(), {
            loading: 'Adding field...',
            success: (newField) => {
                reset();
                onClose();
                return `Custom field "${newField.name}" added!`;
            },
            error: (err) => err.data?.message || 'Failed to add field.',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Custom Field</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Field Name</Label>
                        <Input id="name" {...register('name', { required: 'Field name is required.' })} placeholder="e.g., Referral Source" />
                        {errors.name && <p className="text-sm text-red-600 dark:text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEXT">Text</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                        <SelectItem value="DATE">Date</SelectItem>
                                        <SelectItem value="BOOLEAN">Checkbox (Yes/No)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-opacity-80 text-white">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Adding...' : 'Add Field'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}