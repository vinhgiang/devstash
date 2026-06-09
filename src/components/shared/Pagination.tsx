import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPageNumbers } from '@/lib/constants/pagination'

interface PaginationProps {
  /** Path the page links point at, e.g. `/items/snippet` or `/collections/abc`. */
  basePath: string
  currentPage: number
  totalPages: number
}

function hrefFor(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`
}

const baseLink =
  'inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-md border text-sm transition-colors'

export function Pagination({ basePath, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-2"
    >
      {hasPrev ? (
        <Link
          href={hrefFor(basePath, currentPage - 1)}
          aria-label="Previous page"
          className={cn(baseLink, 'border-border hover:bg-accent')}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(baseLink, 'border-border/50 text-muted-foreground/40 cursor-not-allowed')}
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center h-9 min-w-9 px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className={cn(baseLink, 'border-primary bg-primary text-primary-foreground')}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(basePath, page)}
            className={cn(baseLink, 'border-border hover:bg-accent')}
          >
            {page}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link
          href={hrefFor(basePath, currentPage + 1)}
          aria-label="Next page"
          className={cn(baseLink, 'border-border hover:bg-accent')}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(baseLink, 'border-border/50 text-muted-foreground/40 cursor-not-allowed')}
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
