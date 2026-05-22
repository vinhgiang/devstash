'use client';

import { useState } from 'react';
import {
  File,
  FileCode,
  FileSpreadsheet,
  FileText,
  Download,
  Pin,
  Star,
} from 'lucide-react';
import { ItemDrawer } from '@/components/items/ItemDrawer';
import { formatBytes, getExtension } from '@/lib/constants/file-upload';

interface FileItem {
  id: string;
  title: string;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt: string;
  isPinned?: boolean;
  isFavorite?: boolean;
}

interface FileListViewProps {
  items: FileItem[];
}

const EXT_ICON_MAP: Record<string, typeof File> = {
  '.pdf': FileText,
  '.txt': FileText,
  '.md': FileText,
  '.json': FileCode,
  '.yaml': FileCode,
  '.yml': FileCode,
  '.xml': FileCode,
  '.toml': FileCode,
  '.ini': FileCode,
  '.csv': FileSpreadsheet,
};

function fileIcon(fileName?: string | null): typeof File {
  if (!fileName) return File;
  const ext = getExtension(fileName);
  return EXT_ICON_MAP[ext] ?? File;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function FileListView({ items }: FileListViewProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        {items.map((item, idx) => {
          const IconComp = fileIcon(item.fileName);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenId(item.id)}
              className={[
                'w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                idx !== 0 ? 'border-t border-border' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <IconComp className="size-5 shrink-0 text-muted-foreground" />

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  {item.isPinned && (
                    <Pin className="size-3 shrink-0 fill-current text-muted-foreground" />
                  )}
                  {item.isFavorite && (
                    <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                {/* Secondary line: filename on desktop, full meta on mobile */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {item.fileName && (
                    <span className="truncate hidden sm:block">{item.fileName}</span>
                  )}
                  {item.fileSize != null && (
                    <span className="sm:hidden">{formatBytes(item.fileSize)}</span>
                  )}
                  <span className="sm:hidden text-muted-foreground/50">·</span>
                  <span className="sm:hidden">{formatDate(item.createdAt)}</span>
                </div>
              </div>

              {/* Desktop: size + date */}
              <span className="hidden sm:block text-xs text-muted-foreground tabular-nums w-16 text-right shrink-0">
                {item.fileSize != null ? formatBytes(item.fileSize) : '—'}
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground w-28 text-right shrink-0">
                {formatDate(item.createdAt)}
              </span>

              {/* Download button */}
              <a
                href={`/api/files/${item.id}?download=1`}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Download"
              >
                <Download className="size-4" />
              </a>
            </button>
          );
        })}
      </div>
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
