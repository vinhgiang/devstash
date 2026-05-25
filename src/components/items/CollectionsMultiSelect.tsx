'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollectionOption {
  id: string;
  name: string;
}

interface CollectionsMultiSelectProps {
  options: CollectionOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function CollectionsMultiSelect({
  options,
  value,
  onChange,
  disabled,
}: CollectionsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = new Set(value);
  const selectedOptions = options.filter((o) => selected.has(o.id));

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = (id: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  const removeChip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const next = new Set(selected);
    next.delete(id);
    onChange(Array.from(next));
  };

  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground rounded-md border border-dashed border-border px-3 py-2">
        No collections yet. Create one to organize items.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full min-h-9 items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm dark:bg-input/30',
          'focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">Select collections…</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
              >
                {opt.name}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => removeChip(opt.id, e)}
                  className="rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${opt.name}`}
                >
                  <X className="size-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1"
        >
          {options.map((opt) => {
            const isSelected = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(opt.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-accent/50',
                )}
              >
                <span className="flex size-4 items-center justify-center shrink-0">
                  {isSelected && <Check className="size-3.5" />}
                </span>
                <span className="truncate">{opt.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
