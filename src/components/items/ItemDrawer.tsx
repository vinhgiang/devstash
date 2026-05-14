'use client';

import { useEffect, useState } from 'react';
import { Copy, Pencil, Pin, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ItemDetail } from '@/lib/db/items';

interface ItemDrawerProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !itemId) {
      setItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg flex flex-col gap-0 p-0"
      >
        {loading || !item ? (
          <DrawerSkeleton />
        ) : (
          <DrawerBody item={item} onCopy={handleCopy} />
        )}
      </SheetContent>
    </Sheet>
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

function DrawerBody({ item, onCopy }: { item: ItemDetail; onCopy: () => void }) {
  const IconComp = ICON_COMPONENTS[item.type.icon as keyof typeof ICON_COMPONENTS];
  const typeLabel = item.type.name.charAt(0).toUpperCase() + item.type.name.slice(1) + 's';

  return (
    <>
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
        <ActionButton icon={<Copy className="size-4" />} label="Copy" onClick={onCopy} />
        <ActionButton icon={<Pencil className="size-4" />} label="Edit" />
        <div className="flex-1" />
        <ActionButton
          icon={<Trash2 className="size-4" />}
          label="Delete"
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
            <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
              <code>{item.content}</code>
            </pre>
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
          <Section label="File">
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {item.fileName ?? 'Download'}
            </a>
            {item.fileSize !== null && (
              <p className="text-xs text-muted-foreground mt-1">{formatBytes(item.fileSize)}</p>
            )}
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
