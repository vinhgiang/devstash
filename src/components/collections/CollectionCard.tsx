'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { deleteCollection } from '@/actions/collections';

interface TypeIcon {
  icon: string;
  color: string;
}

export interface CollectionCardData {
  id: string;
  name: string;
  description?: string | null;
  isFavorite: boolean;
  itemCount: number;
  borderColor?: string | null;
  typeIcons: TypeIcon[];
}

export function CollectionCard({ collection }: { collection: CollectionCardData }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localName, setLocalName] = useState(collection.name);
  const [localDescription, setLocalDescription] = useState(collection.description ?? null);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Collection deleted');
    setDeleteOpen(false);
    router.refresh();
  };

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={() => router.push(`/collections/${collection.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push(`/collections/${collection.id}`);
        }}
        className="group relative rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors border-l-2 cursor-pointer"
        style={collection.borderColor ? { borderLeftColor: collection.borderColor } : undefined}
      >
        <div className="flex items-start gap-2 mb-1">
          <p className="font-medium text-sm flex-1 leading-snug">{localName}</p>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {collection.isFavorite && (
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center rounded p-0.5 hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Collection actions"
              >
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                  className="gap-2"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="gap-2">
                  <Star className="size-3.5" />
                  Favorite
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{collection.itemCount} items</p>
        {localDescription && (
          <p className="text-xs text-muted-foreground/60 mb-3 line-clamp-2">{localDescription}</p>
        )}
        {collection.typeIcons.length > 0 && (
          <div className="flex items-center gap-1.5 mt-auto">
            {collection.typeIcons.map(({ icon, color }) => {
              const IconComp = ICON_COMPONENTS[icon as keyof typeof ICON_COMPONENTS];
              return IconComp ? (
                <IconComp key={icon} className="size-3.5" style={{ color }} />
              ) : null;
            })}
          </div>
        )}
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={{ id: collection.id, name: localName, description: localDescription }}
        onSuccess={({ name, description }) => {
          setLocalName(name);
          setLocalDescription(description);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{localName}&quot; will be deleted. Items in this collection will not be deleted — they will just be removed from this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
