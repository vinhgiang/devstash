'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link2,
  Star,
  Settings,
  ChevronDown,
  Package,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/lib/mock-data';
import type { ItemTypeWithCount } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

const ICON_COMPONENTS = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: Link2,
} as const;

interface AppSidebarProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  itemTypes: ItemTypeWithCount[];
  collections: SidebarCollection[];
}

export function AppSidebar({ onClose, showCloseButton, itemTypes, collections }: AppSidebarProps) {
  const [typesOpen, setTypesOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <span className="font-semibold text-lg">DevStash</span>
        </div>
        {showCloseButton && (
          <Button variant="ghost" size="icon" onClick={onClose} className="size-7">
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Types */}
        <div className="mb-1">
          <button
            onClick={() => setTypesOpen((v) => !v)}
            className="flex items-center justify-between w-full px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Types</span>
            <ChevronDown
              className={cn('size-3.5 transition-transform duration-150', !typesOpen && '-rotate-90')}
            />
          </button>
          {typesOpen && (
            <ul className="mt-0.5 space-y-px">
              {itemTypes.map((type) => {
                const IconComp = ICON_COMPONENTS[type.icon as keyof typeof ICON_COMPONENTS];
                const displayName = type.name.charAt(0).toUpperCase() + type.name.slice(1) + 's';
                return (
                  <li key={type.id}>
                    <Link
                      href={`/items/${type.name}`}
                      className="flex items-center gap-2.5 px-3 py-1.5 mx-1 rounded-md hover:bg-muted/60 transition-colors text-sm text-foreground/75 hover:text-foreground"
                    >
                      {IconComp && (
                        <IconComp className="size-4 shrink-0" style={{ color: type.color }} />
                      )}
                      <span className="flex-1">{displayName}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{type.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="h-px bg-border mx-4 my-2" />

        {/* Collections */}
        <div>
          <button
            onClick={() => setCollectionsOpen((v) => !v)}
            className="flex items-center justify-between w-full px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Collections</span>
            <ChevronDown
              className={cn('size-3.5 transition-transform duration-150', !collectionsOpen && '-rotate-90')}
            />
          </button>
          {collectionsOpen && (
            <>
              {favoriteCollections.length > 0 && (
                <div className="mb-1">
                  <p className="px-4 pt-1 pb-0.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    Favorites
                  </p>
                  <ul className="space-y-px">
                    {favoriteCollections.map((col) => (
                      <li key={col.id}>
                        <Link
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md hover:bg-muted/60 transition-colors text-sm text-foreground/75 hover:text-foreground"
                        >
                          <span className="flex-1 truncate">{col.name}</span>
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recentCollections.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-0.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    Recent
                  </p>
                  <ul className="space-y-px">
                    {recentCollections.map((col) => (
                      <li key={col.id}>
                        <Link
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md hover:bg-muted/60 transition-colors text-sm text-foreground/75 hover:text-foreground"
                        >
                          <span className="flex-1 truncate">{col.name}</span>
                          {col.dotColor && (
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: col.dotColor }}
                            />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="px-1 pt-2">
                <Link
                  href="/collections"
                  className="block px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  View all collections
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* User area */}
      <div className="shrink-0 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0 select-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 size-7">
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}