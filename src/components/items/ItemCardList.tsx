'use client';

import { useState } from 'react';
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
}

interface ItemCardListProps {
  items: CardItem[];
  className?: string;
}

export function ItemCardList({ items, className }: ItemCardListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className={className}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenId(item.id)}
            className="text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors hover:bg-muted/30"
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
        ))}
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
