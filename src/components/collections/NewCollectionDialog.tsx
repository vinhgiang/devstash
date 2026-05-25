'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCollection } from '@/actions/collections';

interface NewCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  description: string;
}

const initialState: FormState = {
  name: '',
  description: '',
};

export function NewCollectionDialog({ open, onOpenChange }: NewCollectionDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState);
      setSaving(false);
    } else {
      setSaving(false);
    }
  }, [open]);

  const nameEmpty = form.name.trim().length === 0;
  const submitDisabled = nameEmpty || saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    setSaving(true);
    const result = await createCollection({
      name: form.name,
      description: form.description,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Collection created');
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
          <DialogDescription>
            Group related items together for quick access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="new-collection-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id="new-collection-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. React Patterns"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="new-collection-description"
              className="text-xs font-medium text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="new-collection-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What goes in this collection?"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
