'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { ItemDrawer } from '@/components/items/ItemDrawer';
import { ICON_COMPONENTS } from '@/lib/constants/item-types';
import type { SearchData } from '@/lib/db/search';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/search');
      if (res.ok) {
        const json: SearchData = await res.json();
        setData(json);
      }
    } catch {
      // ignore — palette stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (open) void loadData();
  }, [open, loadData]);

  const handleSelectItem = (id: string) => {
    onOpenChange(false);
    setDrawerItemId(id);
    setDrawerOpen(true);
  };

  const handleSelectCollection = (id: string) => {
    onOpenChange(false);
    router.push(`/collections/${id}`);
  };

  const items = data?.items ?? [];
  const collections = data?.collections ?? [];
  const hasResults = items.length > 0 || collections.length > 0;

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Search"
        description="Search items and collections"
      >
        <CommandInput placeholder="Search items and collections..." autoFocus />
        <CommandList>
          {loading && !hasResults ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {items.length > 0 && (
            <CommandGroup heading="Items">
              {items.map((item) => {
                const IconComp =
                  ICON_COMPONENTS[item.type.icon as keyof typeof ICON_COMPONENTS];
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    keywords={[item.title, item.preview, item.type.name]}
                    onSelect={() => handleSelectItem(item.id)}
                  >
                    {IconComp && (
                      <IconComp
                        className="size-4 shrink-0"
                        style={{ color: item.type.color }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{item.title}</div>
                      {item.preview && (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.preview}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {items.length > 0 && collections.length > 0 && <CommandSeparator />}

          {collections.length > 0 && (
            <CommandGroup heading="Collections">
              {collections.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  keywords={[c.name]}
                  onSelect={() => handleSelectCollection(c.id)}
                >
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 truncate text-sm">{c.name}</div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
      <ItemDrawer
        itemId={drawerItemId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setDrawerItemId(null);
        }}
      />
    </>
  );
}
