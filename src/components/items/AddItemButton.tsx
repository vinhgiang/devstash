'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewItemDialog, type NewItemTypeSlug } from '@/components/items/NewItemDialog';

interface AddItemButtonProps {
  typeSlug: NewItemTypeSlug;
  label: string;
}

export function AddItemButton({ typeSlug, label }: AddItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        <span>New {label}</span>
      </Button>
      <NewItemDialog open={open} onOpenChange={setOpen} initialType={typeSlug} />
    </>
  );
}
