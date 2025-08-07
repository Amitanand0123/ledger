'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TruncatedTextProps {
  text: string | null | undefined;
  maxLength: number;
  asChild?: boolean;
}

/**
 * A component that truncates text to a specified maximum length,
 * showing the full text in a popover on hover.
 */
export function TruncatedText({ text, maxLength, asChild = false }: TruncatedTextProps) {
  if (!text || text.length === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  const truncated = text.substring(0, maxLength) + '...';

  return (
    <Popover>
      <PopoverTrigger asChild={asChild} className="cursor-pointer">
        <span>{truncated}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-sm md:max-w-md text-sm">
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </PopoverContent>
    </Popover>
  );
}