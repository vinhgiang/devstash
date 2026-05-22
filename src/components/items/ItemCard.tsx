import { Pin, Star } from 'lucide-react';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import type { ItemTypeMeta } from '@/types/item-type';

interface ItemCardProps {
  title: string;
  description?: string;
  tags: string[];
  createdAt: string;
  type: ItemTypeMeta;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export function ItemCard({
  title,
  description,
  tags,
  createdAt,
  type,
  isPinned,
  isFavorite,
}: ItemCardProps) {
  const IconComp = ICON_COMPONENTS[type.icon as keyof typeof ICON_COMPONENTS];
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="h-full rounded-lg border border-border bg-card p-4 border-l-4"
      style={{ borderLeftColor: type.color }}
    >
      <div className="flex items-center gap-3">
        <div
          className="size-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${type.color}20` }}
        >
          {IconComp && <IconComp className="size-4" style={{ color: type.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-medium text-sm truncate">{title}</p>
              {isPinned && <Pin className="size-3 text-muted-foreground shrink-0" />}
              {isFavorite && (
                <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{date}</span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
