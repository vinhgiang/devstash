import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ItemCard } from '@/components/items/ItemCard';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import { getSidebarCollections } from '@/lib/db/collections';
import {
  getItemsByType,
  getItemTypeBySlug,
  getSystemItemTypesWithCounts,
} from '@/lib/db/items';

const TYPE_LABELS: Record<string, { singular: string; plural: string }> = {
  snippet: { singular: 'Snippet', plural: 'Snippets' },
  prompt: { singular: 'Prompt', plural: 'Prompts' },
  command: { singular: 'Command', plural: 'Commands' },
  note: { singular: 'Note', plural: 'Notes' },
  link: { singular: 'Link', plural: 'Links' },
  file: { singular: 'File', plural: 'Files' },
  image: { singular: 'Image', plural: 'Images' },
};

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: slug } = await params;
  const itemType = await getItemTypeBySlug(slug);
  if (!itemType) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const [items, sidebarItemTypes, sidebarCollections] = await Promise.all([
    getItemsByType(userId, itemType.id),
    getSystemItemTypesWithCounts(userId),
    getSidebarCollections(userId),
  ]);

  const labels = TYPE_LABELS[itemType.name];
  const IconComp = ICON_COMPONENTS[itemType.icon as keyof typeof ICON_COMPONENTS];

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
          <div
            className="size-9 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${itemType.color}20` }}
          >
            {IconComp && (
              <IconComp className="size-5" style={{ color: itemType.color }} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{labels.plural}</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? labels.singular.toLowerCase() : labels.plural.toLowerCase()}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No {labels.plural.toLowerCase()} yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                description={item.description}
                tags={item.tags}
                createdAt={item.createdAt}
                type={item.type}
                isPinned={item.isPinned}
                isFavorite={item.isFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
