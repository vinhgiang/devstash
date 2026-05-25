'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemDrawer } from '@/components/items/ItemDrawer';
import type { ItemTypeMeta } from '@/types/item-type';

interface CardItem {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: string;
  type: ItemTypeMeta;
  isPinned?: boolean;
  isFavorite?: boolean;
  content?: string | null;
  url?: string | null;
}

interface ItemCardListProps {
  items: CardItem[];
  className?: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background/80 hover:bg-muted border border-border"
    >
      {copied ? (
        <Check className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

export function ItemCardList({ items, className }: ItemCardListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className={className}>
        {items.map((item) => {
          const copyValue = item.url ?? item.content ?? null;
          return (
            <div key={item.id} className="relative h-full group">
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                className="h-full w-full text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors hover:bg-muted/30"
              >
                <ItemCard
                  title={item.title}
                  description={item.description}
                  tags={item.tags}
                  createdAt={item.createdAt}
                  type={item.type}
                  isPinned={item.isPinned}
                  isFavorite={item.isFavorite}
                />
              </button>
              {copyValue && <CopyButton value={copyValue} />}
            </div>
          );
        })}
      </div>
      <ItemDrawer
        itemId={openId}
        open={openId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}
