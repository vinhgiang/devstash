import { notFound, redirect } from 'next/navigation';
import { FolderOpen, Star } from 'lucide-react';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ItemCardList } from '@/components/items/ItemCardList';
import { CollectionDetailActions } from '@/components/collections/CollectionDetailActions';
import { Pagination } from '@/components/shared/Pagination';
import {
  ITEMS_PER_PAGE,
  getTotalPages,
  parsePageParam,
} from '@/lib/constants/pagination';
import {
  getCollectionById,
  getSidebarCollections,
} from '@/lib/db/collections';
import {
  getItemsByCollection,
  getSystemItemTypesWithCounts,
} from '@/lib/db/items';

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  const requestedPage = Math.max(1, Math.trunc(Number(pageParam)) || 1);
  const [paged, sidebarItemTypes, sidebarCollections] = await Promise.all([
    getItemsByCollection(userId, id, requestedPage),
    getSystemItemTypesWithCounts(userId),
    getSidebarCollections(userId),
  ]);

  const totalPages = getTotalPages(paged.total, ITEMS_PER_PAGE);
  const currentPage = parsePageParam(pageParam, totalPages);
  let items = paged.rows;
  if (currentPage !== requestedPage) {
    items = (await getItemsByCollection(userId, id, currentPage)).rows;
  }

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
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-md flex items-center justify-center shrink-0 bg-muted">
            <FolderOpen className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold truncate">{collection.name}</h1>
              {collection.isFavorite && (
                <Star className="size-5 fill-yellow-400 text-yellow-400 shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {paged.total} {paged.total === 1 ? 'item' : 'items'}
            </p>
            {collection.description && (
              <p className="mt-2 text-sm text-muted-foreground/80">
                {collection.description}
              </p>
            )}
          </div>
          <CollectionDetailActions
            collection={{
              id: collection.id,
              name: collection.name,
              description: collection.description,
              isFavorite: collection.isFavorite,
            }}
          />
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
          </div>
        ) : (
          <ItemCardList
            items={items}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          />
        )}

        <Pagination
          basePath={`/collections/${collection.id}`}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}
