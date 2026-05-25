import Link from 'next/link';
import { Star, MoreHorizontal } from 'lucide-react';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';

interface TypeIcon {
  icon: string;
  color: string;
}

export interface CollectionCardData {
  id: string;
  name: string;
  description?: string | null;
  isFavorite: boolean;
  itemCount: number;
  borderColor?: string | null;
  typeIcons: TypeIcon[];
}

export function CollectionCard({ collection }: { collection: CollectionCardData }) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors border-l-2"
      style={collection.borderColor ? { borderLeftColor: collection.borderColor } : undefined}
    >
      <div className="flex items-start gap-2 mb-1">
        <p className="font-medium text-sm flex-1 leading-snug">{collection.name}</p>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {collection.isFavorite && (
            <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
          )}
          <MoreHorizontal className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{collection.itemCount} items</p>
      {collection.description && (
        <p className="text-xs text-muted-foreground/60 mb-3 line-clamp-2">{collection.description}</p>
      )}
      {collection.typeIcons.length > 0 && (
        <div className="flex items-center gap-1.5 mt-auto">
          {collection.typeIcons.map(({ icon, color }) => {
            const IconComp = ICON_COMPONENTS[icon as keyof typeof ICON_COMPONENTS];
            return IconComp ? (
              <IconComp key={icon} className="size-3.5" style={{ color }} />
            ) : null;
          })}
        </div>
      )}
    </Link>
  );
}
