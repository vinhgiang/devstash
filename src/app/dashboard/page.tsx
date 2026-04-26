import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentCollections } from '@/components/dashboard/RecentCollections';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { items, collections, itemTypes, itemTypeCounts, collectionItemCounts } from '@/lib/mock-data';

export default function DashboardPage() {
  const totalItems = Object.values(itemTypeCounts).reduce((a, b) => a + b, 0);
  const totalCollections = collections.length;
  const favoriteItems = items.filter((i) => i.isFavorite).length;
  const favoriteCollections = collections.filter((c) => c.isFavorite).length;

  const collectionsWithMeta = collections.map((col) => {
    const colItems = items.filter((i) => col.itemIds.includes(i.id));
    const typeIds = [...new Set(colItems.map((i) => i.typeId))];
    const typeIcons = typeIds
      .map((tid) => itemTypes.find((t) => t.id === tid))
      .filter((t): t is NonNullable<typeof t> => t !== undefined)
      .map((t) => ({ icon: t.icon, color: t.color }));
    return {
      ...col,
      itemCount: collectionItemCounts[col.id] ?? col.itemIds.length,
      typeIcons,
    };
  });

  const pinnedItems = items
    .filter((i) => i.isPinned)
    .map((item) => ({ ...item, type: itemTypes.find((t) => t.id === item.typeId)! }));

  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((item) => ({ ...item, type: itemTypes.find((t) => t.id === item.typeId)! }));

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your developer knowledge hub</p>
        </div>
        <StatsCards
          totalItems={totalItems}
          totalCollections={totalCollections}
          favoriteItems={favoriteItems}
          favoriteCollections={favoriteCollections}
        />
        <RecentCollections collections={collectionsWithMeta} />
        <PinnedItems items={pinnedItems} />
        <RecentItems items={recentItems} />
      </div>
    </DashboardShell>
  );
}