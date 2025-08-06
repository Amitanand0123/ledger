'use client'

import { useState } from 'react';
import { useGetPlatformsQuery } from '@/lib/redux/slices/platformApiSlice';
import { useDebouncedCallback } from 'use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const PREDEFINED_PLATFORMS = ["LinkedIn", "Naukri", "Internshala", "Cuvette", "Wellfound", "Instahyre", "Indeed", "Company Website", "Referral"];

interface PlatformComboboxProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export function PlatformCombobox({ value, onChange }: PlatformComboboxProps) {
    const { data: session } = useSession();
    const isGuest = !session;
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSetSearch = useDebouncedCallback(setSearch, 300);

    const { data: fetchedPlatforms, isLoading } = useGetPlatformsQuery(search, {
      skip: isGuest, // Don't fetch for guest users
    });

    const handleSelect = (newValue: string | null) => {
        onChange(newValue);
        setOpen(false);
        setSearch("");
    };

    // Combine predefined platforms with fetched platforms, removing duplicates
    const allPlatforms = new Set([...PREDEFINED_PLATFORMS, ...(fetchedPlatforms?.map(p => p.name) || [])]);
    const platformList = Array.from(allPlatforms).sort();

    const currentPlatform = value || "Select platform...";
    const showAddOption = search && !platformList.some(p => p.toLowerCase() === search.toLowerCase());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
                    <span className="truncate">{currentPlatform}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput 
                        placeholder="Search or add platform..."
                        onValueChange={debouncedSetSearch}
                    />
                    <CommandList>
                        {isLoading && <div className="p-2 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
                        
                        <CommandEmpty>
                            {showAddOption ? (
                                <CommandItem onSelect={() => handleSelect(search)} className="cursor-pointer">
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add: "{search}"
                                </CommandItem>
                            ) : (
                                <div className="p-2 text-center text-sm">No platform found.</div>
                            )}
                        </CommandEmpty>

                        <CommandGroup>
                            {platformList.map((platform) => (
                                <CommandItem
                                    key={platform}
                                    value={platform}
                                    onSelect={() => handleSelect(platform)}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === platform ? "opacity-100" : "opacity-0")} />
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