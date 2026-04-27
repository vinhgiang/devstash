'use client';

import { useState } from 'react';
import { PanelLeft, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSidebar } from './AppSidebar';
import type { ItemTypeWithCount } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

interface SidebarData {
  itemTypes: ItemTypeWithCount[];
  collections: SidebarCollection[];
}

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarData: SidebarData;
}

export function DashboardShell({ children, sidebarData }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  };

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
        <AppSidebar itemTypes={sidebarData.itemTypes} collections={sidebarData.collections} />
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
        />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 h-14 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleToggle}>
              <PanelLeft className="size-4" />
            </Button>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input type="search" placeholder="Search items..." className="pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden sm:flex">
              <Plus className="size-4" />
              New Collection
            </Button>
            <Button>
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Item</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}