import { Pin, Star } from 'lucide-react';

interface ImageGalleryCardProps {
  id: string;
  title: string;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export function ImageGalleryCard({ id, title, isPinned, isFavorite }: ImageGalleryCardProps) {
  return (
    <>
      <div className="aspect-video overflow-hidden">
        <img
          src={`/api/files/${id}`}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm truncate flex-1">{title}</p>
          {isPinned && <Pin className="size-3 text-muted-foreground shrink-0" />}
          {isFavorite && <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />}
        </div>
      </div>
    </>
  );
}
