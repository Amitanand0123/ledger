'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// FIXED: Add predefined list as requested
const PREDEFINED_PLATFORMS = ["LinkedIn", "Naukri", "Internshala", "Cuvette", "Wellfound", "Instahyre", "Indeed", "Company Website"];

interface PlatformComboboxProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export function PlatformCombobox({ value, onChange }: PlatformComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const handleSelect = (newValue: string | null) => {
        onChange(newValue === value ? null : newValue);
        setOpen(false);
        setSearchValue("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value || "Select platform..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput 
                        placeholder="Search or add platform..."
                        onValue-change={setSearchValue}
                    />
                    <CommandList>
                        {/* FIXED: Allow adding custom platform */}
                        <CommandEmpty>
                             <CommandItem onSelect={() => handleSelect(searchValue)} className="cursor-pointer">
                                <PlusCircle className="mr-2 h-4 w-4"/> Add: &ldquo;{searchValue}&ldquo;
                            </CommandItem>
                        </CommandEmpty>
                        <CommandGroup>
                            {PREDEFINED_PLATFORMS.map((platform) => (
                                <CommandItem
                                    key={platform}
                                    value={platform}
                                    onSelect={() => handleSelect(platform)}
                                >
                                    <Check
                                        className={cn("mr-2 h-4 w-4", value === platform ? "opacity-100" : "opacity-0")}
                                    />
                                    {platform}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}