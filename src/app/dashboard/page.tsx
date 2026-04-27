import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentCollections } from '@/components/dashboard/RecentCollections';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { getRecentCollections, getCollectionStats, getSidebarCollections } from '@/lib/db/collections';
import {
  getItemStats,
  getSystemItemTypesWithCounts,
  getPinnedItems,
  getRecentItems,
} from '@/lib/db/items';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@devstash.io' },
    select: { id: true },
  });
  const userId = demoUser?.id ?? '';

  const [
    recentCollections,
    collectionStats,
    itemStats,
    sidebarItemTypes,
    sidebarCollections,
    pinnedItems,
    recentItems,
  ] = await Promise.all([
    getRecentCollections(userId),
    getCollectionStats(userId),
    getItemStats(userId),
    getSystemItemTypesWithCounts(userId),
    getSidebarCollections(userId),
    getPinnedItems(userId),
    getRecentItems(userId),
  ]);

  return (
    <DashboardShell sidebarData={{ itemTypes: sidebarItemTypes, collections: sidebarCollections }}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your developer knowledge hub</p>
        </div>
        <StatsCards
          totalItems={itemStats.total}
          totalCollections={collectionStats.total}
          favoriteItems={itemStats.favorites}
          favoriteCollections={collectionStats.favorites}
        />
        <RecentCollections collections={recentCollections} />
        <PinnedItems items={pinnedItems} />
        <RecentItems items={recentItems} />
      </div>
    </DashboardShell>
  );
}