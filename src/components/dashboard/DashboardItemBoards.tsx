'use client';

import { useState } from 'react';
import { PinnedItems } from '@/components/dashboard/PinnedItems';
import { RecentItems } from '@/components/dashboard/RecentItems';
import { ItemDrawer } from '@/components/items/ItemDrawer';
import type { ItemTypeMeta } from '@/types/item-type';

interface DashboardItem {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: string;
  type: ItemTypeMeta;
}

interface DashboardItemBoardsProps {
  pinnedItems: DashboardItem[];
  recentItems: DashboardItem[];
}

export function DashboardItemBoards({ pinnedItems, recentItems }: DashboardItemBoardsProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <PinnedItems items={pinnedItems} onItemClick={setOpenId} />
      <RecentItems items={recentItems} onItemClick={setOpenId} />
      <ItemDrawer
        itemId={openId}
        open={openId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}
