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
import { updateCollection } from '@/actions/collections';

interface Collection {
  id: string;
  name: string;
  description?: string | null;
}

interface EditCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  onSuccess?: (updated: { name: string; description: string | null }) => void;
}

interface FormState {
  name: string;
  description: string;
}

export function EditCollectionDialog({
  open,
  onOpenChange,
  collection,
  onSuccess,
}: EditCollectionDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: collection.name,
    description: collection.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: collection.name, description: collection.description ?? '' });
      setSaving(false);
    }
  }, [open, collection.name, collection.description]);

  const nameEmpty = form.name.trim().length === 0;
  const submitDisabled = nameEmpty || saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    setSaving(true);
    const result = await updateCollection(collection.id, {
      name: form.name,
      description: form.description,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Collection updated');
    onOpenChange(false);
    onSuccess?.({ name: result.data.name, description: result.data.description });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>Update the name or description of this collection.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-collection-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id="edit-collection-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. React Patterns"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-collection-description"
              className="text-xs font-medium text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="edit-collection-description"
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
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
