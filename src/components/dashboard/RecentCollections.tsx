import Link from 'next/link';
import { CollectionCard, type CollectionCardData } from '@/components/collections/CollectionCard';

interface RecentCollectionsProps {
  collections: CollectionCardData[];
}

export function RecentCollections({ collections }: RecentCollectionsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {collections.map((col) => (
          <CollectionCard key={col.id} collection={col} />
        ))}
      </div>
    </section>
  );
}
