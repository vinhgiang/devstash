'use client';

import { useState } from 'react';
import { ImageGalleryCard } from '@/components/items/ImageGalleryCard';
import { ItemDrawer } from '@/components/items/ItemDrawer';

interface GalleryItem {
  id: string;
  title: string;
  isPinned?: boolean;
  isFavorite?: boolean;
}

interface ImageGalleryListProps {
  items: GalleryItem[];
}

export function ImageGalleryList({ items }: ImageGalleryListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenId(item.id)}
            className="group text-left rounded-lg overflow-hidden border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ImageGalleryCard
              id={item.id}
              title={item.title}
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
