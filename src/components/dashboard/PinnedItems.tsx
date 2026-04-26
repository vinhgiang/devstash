import { Pin, Code, Sparkles, Terminal, StickyNote, File, Image, Link2 } from 'lucide-react';

const ICON_COMPONENTS = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: Link2,
} as const;

interface ItemType {
  icon: string;
  color: string;
  name: string;
}

interface PinnedItem {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: string;
  type: ItemType;
}

interface PinnedItemsProps {
  items: PinnedItem[];
}

export function PinnedItems({ items }: PinnedItemsProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Pin className="size-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Pinned</h2>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const IconComp = ICON_COMPONENTS[item.type.icon as keyof typeof ICON_COMPONENTS];
          const date = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className="size-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${item.type.color}20` }}
                >
                  {IconComp && (
                    <IconComp className="size-4" style={{ color: item.type.color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{date}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.tags.length > 0 && (
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}