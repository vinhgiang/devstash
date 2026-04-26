import { Package, FolderOpen, Star, Bookmark } from 'lucide-react';

interface StatsCardsProps {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

export function StatsCards({
  totalItems,
  totalCollections,
  favoriteItems,
  favoriteCollections,
}: StatsCardsProps) {
  const stats = [
    { label: 'Total Items', value: totalItems, icon: Package },
    { label: 'Collections', value: totalCollections, icon: FolderOpen },
    { label: 'Favorite Items', value: favoriteItems, icon: Star },
    { label: 'Favorite Collections', value: favoriteCollections, icon: Bookmark },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="size-3.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}