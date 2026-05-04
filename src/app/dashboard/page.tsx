import { redirect } from 'next/navigation';
import { auth } from '@/auth';
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

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const userId = session.user.id;

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
    <DashboardShell
      sidebarData={{ itemTypes: sidebarItemTypes, collections: sidebarCollections }}
      user={{
        name: session.user.name ?? session.user.email ?? 'User',
        email: session.user.email ?? '',
        image: session.user.image,
      }}
    >
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
