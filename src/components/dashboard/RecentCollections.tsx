import Link from 'next/link';
import { Star, MoreHorizontal, Code, Sparkles, Terminal, StickyNote, File, Image, Link2 } from 'lucide-react';

const ICON_COMPONENTS = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: Link2,
} as const;

interface TypeIcon {
  icon: string;
  color: string;
}

interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  isFavorite: boolean;
  itemCount: number;
  typeIcons: TypeIcon[];
}

interface RecentCollectionsProps {
  collections: CollectionItem[];
}

export function RecentCollections({ collections }: RecentCollectionsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.id}`}
            className="group relative rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start gap-2 mb-1">
              <p className="font-medium text-sm flex-1 leading-snug">{col.name}</p>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {col.isFavorite && (
                  <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                )}
                <MoreHorizontal className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{col.itemCount} items</p>
            {col.description && (
              <p className="text-xs text-muted-foreground/60 mb-3 line-clamp-2">{col.description}</p>
            )}
            {col.typeIcons.length > 0 && (
              <div className="flex items-center gap-1.5 mt-auto">
                {col.typeIcons.map(({ icon, color }, i) => {
                  const IconComp = ICON_COMPONENTS[icon as keyof typeof ICON_COMPONENTS];
                  return IconComp ? (
                    <IconComp key={i} className="size-3.5" style={{ color }} />
                  ) : null;
                })}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}