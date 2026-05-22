'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Download, File as FileIcon, Pencil, Pin, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import { formatBytes } from '@/lib/constants/file-upload';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { CodeEditor } from '@/components/items/CodeEditor';
import { MarkdownEditor } from '@/components/items/MarkdownEditor';
import { deleteItem, updateItem } from '@/actions/items';
import type { ItemDetail } from '@/lib/db/items';

interface ItemDrawerProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'view' | 'edit';

const TYPES_WITH_CONTENT = new Set(['snippet', 'prompt', 'command', 'note']);
const TYPES_WITH_LANGUAGE = new Set(['snippet', 'command']);
const TYPES_WITH_CODE_EDITOR = new Set(['snippet', 'command']);

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !itemId) {
      setItem(null);
      setMode('view');
      setConfirmDelete(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setMode('view');
    fetch(`/api/items/${itemId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: ItemDetail) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load item');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const handleCopy = async () => {
    if (!item) return;
    const text = item.content ?? item.url ?? '';
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!item || deleting) return;
    setDeleting(true);
    const result = await deleteItem(item.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Item deleted');
    setConfirmDelete(false);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg flex flex-col gap-0 p-0"
        >
          {loading || !item ? (
            <DrawerSkeleton />
          ) : mode === 'edit' ? (
            <EditMode
              item={item}
              onCancel={() => setMode('view')}
              onSaved={(updated) => {
                setItem(updated);
                setMode('view');
              }}
            />
          ) : (
            <ViewMode
              item={item}
              onCopy={handleCopy}
              onEdit={() => setMode('edit')}
              onDelete={() => setConfirmDelete(true)}
            />
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!deleting) setConfirmDelete(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {item ? `"${item.title}" will be permanently deleted. This cannot be undone.` : 'This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-md bg-muted animate-pulse" />
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="h-9 w-full bg-muted rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-16 w-full bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-32 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

function DrawerHeader({ item }: { item: ItemDetail }) {
  const IconComp = ICON_COMPONENTS[item.type.icon as keyof typeof ICON_COMPONENTS];
  const typeLabel = item.type.name.charAt(0).toUpperCase() + item.type.name.slice(1) + 's';
  return (
    <div className="flex items-center gap-3 px-6 pt-6 pb-3 pr-12">
      <div
        className="size-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${item.type.color}20` }}
      >
        {IconComp && <IconComp className="size-4" style={{ color: item.type.color }} />}
      </div>
      <div className="min-w-0 flex-1">
        <SheetTitle className="text-base font-semibold truncate">{item.title}</SheetTitle>
        <SheetDescription className="sr-only">Item details</SheetDescription>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span>{typeLabel}</span>
          {item.language && (
            <>
              <span>·</span>
              <span>{item.language}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewMode({
  item,
  onCopy,
  onEdit,
  onDelete,
}: {
  item: ItemDetail;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <DrawerHeader item={item} />

      <div className="flex items-center gap-1 px-4 py-2 border-y border-border">
        <ActionButton
          icon={
            <Star
              className={
                item.isFavorite ? 'size-4 fill-yellow-400 text-yellow-400' : 'size-4'
              }
            />
          }
          label="Favorite"
        />
        <ActionButton
          icon={<Pin className={item.isPinned ? 'size-4 fill-foreground' : 'size-4'} />}
          label="Pin"
        />
        {item.contentType !== 'FILE' && (
          <ActionButton icon={<Copy className="size-4" />} label="Copy" onClick={onCopy} />
        )}
        <ActionButton icon={<Pencil className="size-4" />} label="Edit" onClick={onEdit} />
        <div className="flex-1" />
        <ActionButton
          icon={<Trash2 className="size-4" />}
          label="Delete"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {item.description && (
          <Section label="Description">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{item.description}</p>
          </Section>
        )}

        {item.contentType === 'TEXT' && item.content && (
          <Section label="Content">
            {TYPES_WITH_CODE_EDITOR.has(item.type.name) ? (
              <CodeEditor
                value={item.content}
                language={item.language}
                readOnly
                ariaLabel="Code content"
              />
            ) : (
              <MarkdownEditor value={item.content} readOnly ariaLabel="Markdown content" />
            )}
          </Section>
        )}

        {item.contentType === 'URL' && item.url && (
          <Section label="URL">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {item.url}
            </a>
          </Section>
        )}

        {item.contentType === 'FILE' && item.fileUrl && (
          <Section label={item.type.name === 'image' ? 'Image' : 'File'}>
            <FileContent item={item} />
          </Section>
        )}

        {item.tags.length > 0 && (
          <Section label="Tags">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {item.collections.length > 0 && (
          <Section label="Collections">
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-md text-xs bg-muted text-foreground/80"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section label="Details">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-right text-foreground/90">{formatDate(item.createdAt)}</dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="text-right text-foreground/90">{formatDate(item.updatedAt)}</dd>
          </dl>
        </Section>
      </div>
    </>
  );
}

interface EditFormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tagsInput: string;
}

function itemToFormState(item: ItemDetail): EditFormState {
  return {
    title: item.title,
    description: item.description ?? '',
    content: item.content ?? '',
    url: item.url ?? '',
    language: item.language ?? '',
    tagsInput: item.tags.join(', '),
  };
}

function EditMode({
  item,
  onCancel,
  onSaved,
}: {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (updated: ItemDetail) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditFormState>(() => itemToFormState(item));
  const [saving, setSaving] = useState(false);

  const typeName = item.type.name;
  const showContent = TYPES_WITH_CONTENT.has(typeName);
  const showLanguage = TYPES_WITH_LANGUAGE.has(typeName);
  const showUrl = typeName === 'link';

  const titleEmpty = form.title.trim().length === 0;

  const handleSave = async () => {
    if (titleEmpty || saving) return;
    setSaving(true);
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const result = await updateItem(item.id, {
      title: form.title,
      description: form.description,
      content: showContent ? form.content : null,
      url: showUrl ? form.url : null,
      language: showLanguage ? form.language : null,
      tags,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Item updated');
    onSaved(result.data);
    router.refresh();
  };

  return (
    <>
      <DrawerHeader item={item} />

      <div className="flex items-center gap-2 px-4 py-2 border-y border-border">
        <Button size="sm" onClick={handleSave} disabled={titleEmpty || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <Field htmlFor="item-title" label="Title">
          <Input
            id="item-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            aria-invalid={titleEmpty || undefined}
          />
        </Field>

        <Field htmlFor="item-description" label="Description">
          <Textarea
            id="item-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        {showContent && (
          <Field htmlFor="item-content" label="Content">
            {TYPES_WITH_CODE_EDITOR.has(typeName) ? (
              <CodeEditor
                value={form.content}
                language={form.language}
                onChange={(content) => setForm((f) => ({ ...f, content }))}
                ariaLabel="Code content"
              />
            ) : (
              <MarkdownEditor
                value={form.content}
                onChange={(content) => setForm((f) => ({ ...f, content }))}
                ariaLabel="Markdown content"
              />
            )}
          </Field>
        )}

        {showLanguage && (
          <Field htmlFor="item-language" label="Language">
            <Input
              id="item-language"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              placeholder="e.g. typescript"
            />
          </Field>
        )}

        {showUrl && (
          <Field htmlFor="item-url" label="URL">
            <Input
              id="item-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com"
            />
          </Field>
        )}

        <Field htmlFor="item-tags" label="Tags">
          <Input
            id="item-tags"
            value={form.tagsInput}
            onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
            placeholder="comma, separated, tags"
          />
        </Field>

        {item.collections.length > 0 && (
          <Section label="Collections">
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-md text-xs bg-muted text-foreground/80"
                >
                  {c.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Collections are managed separately.
            </p>
          </Section>
        )}

        <Section label="Details">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-right text-foreground/90">{formatDate(item.createdAt)}</dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="text-right text-foreground/90">{formatDate(item.updatedAt)}</dd>
          </dl>
        </Section>
      </div>
    </>
  );
}

function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground ${className ?? ''}`}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

function FileContent({ item }: { item: ItemDetail }) {
  const isImage = item.type.name === 'image';
  const previewSrc = `/api/files/${item.id}`;
  const downloadHref = `/api/files/${item.id}?download=1`;

  return (
    <div className="space-y-3">
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt={item.title}
          className="max-h-80 w-full rounded-md border border-border object-contain bg-muted/30"
        />
      )}
      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        <div className="size-9 rounded bg-muted flex items-center justify-center shrink-0">
          <FileIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.fileName ?? 'File'}</p>
          {item.fileSize !== null && (
            <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
          )}
        </div>
        <a
          href={downloadHref}
          download={item.fileName ?? undefined}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <Download className="size-4" />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
