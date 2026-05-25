import { redirect } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CollectionCard } from '@/components/collections/CollectionCard';
import {
  getAllCollections,
  getSidebarCollections,
} from '@/lib/db/collections';
import { getSystemItemTypesWithCounts } from '@/lib/db/items';

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const [collections, sidebarItemTypes, sidebarCollections] = await Promise.all([
    getAllCollections(userId),
    getSystemItemTypesWithCounts(userId),
    getSidebarCollections(userId),
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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-md flex items-center justify-center shrink-0 bg-muted">
            <FolderOpen className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Collections</h1>
            <p className="text-sm text-muted-foreground">
              {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No collections yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
