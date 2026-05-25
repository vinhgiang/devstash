import { notFound, redirect } from 'next/navigation';
import { FolderOpen, Star } from 'lucide-react';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ItemCardList } from '@/components/items/ItemCardList';
import { ImageGalleryList } from '@/components/items/ImageGalleryList';
import { FileListView } from '@/components/items/FileListView';
import { CollectionDetailActions } from '@/components/collections/CollectionDetailActions';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import {
  getCollectionById,
  getSidebarCollections,
} from '@/lib/db/collections';
import {
  getItemsByCollection,
  getSystemItemTypesWithCounts,
  type ItemWithType,
} from '@/lib/db/items';

const TYPE_SECTION_ORDER = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'];

const TYPE_LABELS: Record<string, { singular: string; plural: string }> = {
  snippet: { singular: 'Snippet', plural: 'Snippets' },
  prompt: { singular: 'Prompt', plural: 'Prompts' },
  command: { singular: 'Command', plural: 'Commands' },
  note: { singular: 'Note', plural: 'Notes' },
  link: { singular: 'Link', plural: 'Links' },
  file: { singular: 'File', plural: 'Files' },
  image: { singular: 'Image', plural: 'Images' },
};

function groupByType(items: ItemWithType[]): Map<string, ItemWithType[]> {
  const groups = new Map<string, ItemWithType[]>();
  for (const item of items) {
    const list = groups.get(item.type.name) ?? [];
    list.push(item);
    groups.set(item.type.name, list);
  }
  return groups;
}

function TypeSection({ slug, items }: { slug: string; items: ItemWithType[] }) {
  const labels = TYPE_LABELS[slug] ?? { singular: slug, plural: slug };
  const sample = items[0];
  const IconComp = sample
    ? ICON_COMPONENTS[sample.type.icon as keyof typeof ICON_COMPONENTS]
    : null;
  const color = sample?.type.color;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {IconComp && color && <IconComp className="size-4" style={{ color }} />}
        <h2 className="text-base font-semibold">{labels.plural}</h2>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      {slug === 'image' ? (
        <ImageGalleryList items={items} />
      ) : slug === 'file' ? (
        <FileListView items={items} />
      ) : (
        <ItemCardList
          items={items}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
        />
      )}
    </section>
  );
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  const [items, sidebarItemTypes, sidebarCollections] = await Promise.all([
    getItemsByCollection(userId, id),
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
              {items.length} {items.length === 1 ? 'item' : 'items'}
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
          (() => {
            const groups = groupByType(items);
            const sortedSlugs = [...groups.keys()].sort((a, b) => {
              const ai = TYPE_SECTION_ORDER.indexOf(a);
              const bi = TYPE_SECTION_ORDER.indexOf(b);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });
            return (
              <div className="space-y-8">
                {sortedSlugs.map((slug) => (
                  <TypeSection key={slug} slug={slug} items={groups.get(slug)!} />
                ))}
              </div>
            );
          })()
        )}
      </div>
    </DashboardShell>
  );
}
