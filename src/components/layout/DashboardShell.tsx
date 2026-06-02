'use client';

import { useEffect, useState } from 'react';
import { PanelLeft, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppSidebar } from './AppSidebar';
import { NewItemDialog } from '@/components/items/NewItemDialog';
import { NewCollectionDialog } from '@/components/collections/NewCollectionDialog';
import { CommandPalette } from '@/components/shared/CommandPalette';
import type { ItemTypeWithCount } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

interface SidebarData {
  itemTypes: ItemTypeWithCount[];
  collections: SidebarCollection[];
}

interface SidebarUser {
  name: string;
  email: string;
  image?: string | null;
}

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarData: SidebarData;
  user: SidebarUser;
}

export function DashboardShell({ children, sidebarData, user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r border-border shrink-0 overflow-hidden',
          'transition-[width] duration-200 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-0 border-r-0'
        )}
      >
        <AppSidebar
          itemTypes={sidebarData.itemTypes}
          collections={sidebarData.collections}
          user={user}
        />
      </aside>

      {/* Mobile drawer backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col bg-sidebar border-r border-border lg:hidden',
          'transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AppSidebar
          onClose={() => setMobileOpen(false)}
          showCloseButton
          itemTypes={sidebarData.itemTypes}
          collections={sidebarData.collections}
          user={user}
        />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 h-14 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleToggle}>
              <PanelLeft className="size-4" />
            </Button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="relative flex-1 max-w-xl flex items-center h-9 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              <Search className="size-4 mr-2 shrink-0" />
              <span className="flex-1 text-left">Search items and collections...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden sm:flex"
              onClick={() => setNewCollectionOpen(true)}
            >
              <Plus className="size-4" />
              New Collection
            </Button>
            <Button onClick={() => setNewItemOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Item</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      <NewItemDialog open={newItemOpen} onOpenChange={setNewItemOpen} />
      <NewCollectionDialog
        open={newCollectionOpen}
        onOpenChange={setNewCollectionOpen}
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}