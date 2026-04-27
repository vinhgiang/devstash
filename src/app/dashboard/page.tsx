import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentCollections } from '@/components/dashboard/RecentCollections';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { items, itemTypes, itemTypeCounts } from '@/lib/mock-data';
import { getRecentCollections, getCollectionStats } from '@/lib/db/collections';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@devstash.io' },
    select: { id: true },
  });
  const userId = demoUser?.id ?? '';

  const [recentCollections, collectionStats] = await Promise.all([
    getRecentCollections(userId),
    getCollectionStats(userId),
  ]);

  const totalItems = Object.values(itemTypeCounts).reduce((a, b) => a + b, 0);
  const favoriteItems = items.filter((i) => i.isFavorite).length;

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
          totalCollections={collectionStats.total}
          favoriteItems={favoriteItems}
          favoriteCollections={collectionStats.favorites}
        />
        <RecentCollections collections={recentCollections} />
        <PinnedItems items={pinnedItems} />
        <RecentItems items={recentItems} />
      </div>
    </DashboardShell>
  );
}