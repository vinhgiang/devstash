import { Code, Sparkles, Terminal, StickyNote, File, Image, Link2 } from 'lucide-react';

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

interface RecentItem {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  type: ItemType;
}

interface RecentItemsProps {
  items: RecentItem[];
}

export function RecentItems({ items }: RecentItemsProps) {
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
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
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
            </div>
          );
        })}
      </div>
    </section>
  );
}