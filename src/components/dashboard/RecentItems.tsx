'use client';

import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import type { ItemTypeMeta } from '@/types/item-type';

interface RecentItem {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  type: ItemTypeMeta;
}

interface RecentItemsProps {
  items: RecentItem[];
  onItemClick?: (id: string) => void;
}

export function RecentItems({ items, onItemClick }: RecentItemsProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-semibold mb-3">Recent Items</h2>
      <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
        {items.map((item) => {
          const IconComp = ICON_COMPONENTS[item.type.icon as keyof typeof ICON_COMPONENTS];
          const date = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick?.(item.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <div
                className="size-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.type.color}20` }}
              >
                {IconComp && (
                  <IconComp className="size-3.5" style={{ color: item.type.color }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{date}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
