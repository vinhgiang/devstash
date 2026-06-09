export const ITEMS_PER_PAGE = 21
export const COLLECTIONS_PER_PAGE = 21
export const DASHBOARD_COLLECTIONS_LIMIT = 6
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10

export interface Paginated<T> {
  rows: T[]
  total: number
}

/**
 * Total number of pages for a given row count and page size.
 * Always at least 1 so an empty list still renders page 1.
 */
export function getTotalPages(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage))
}

/**
 * Parse a raw `?page=` value into a valid 1-based page number, clamped to
 * `[1, totalPages]`. Non-numeric, zero, negative, and out-of-range values
 * fall back to the nearest valid bound.
 */
export function parsePageParam(raw: string | undefined, totalPages: number): number {
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  if (parsed > totalPages) return totalPages
  return parsed
}

/**
 * Zero-based offset to skip for a given page and page size.
 */
export function getSkip(page: number, perPage: number): number {
  return (page - 1) * perPage
}

/**
 * Build the sequence of page links to render, inserting an `'ellipsis'`
 * marker where pages are collapsed. Always includes the first and last page,
 * plus a window around the current page.
 *
 * Example (current 5, total 10): [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */
export function getPageNumbers(
  current: number,
  total: number,
  siblings = 1,
): (number | 'ellipsis')[] {
  // Number of always-visible slots: first + last + current + 2*siblings + 2 ellipses
  const totalSlots = siblings * 2 + 5
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const left = Math.max(current - siblings, 1)
  const right = Math.min(current + siblings, total)
  const showLeftEllipsis = left > 2
  const showRightEllipsis = right < total - 1

  const pages: (number | 'ellipsis')[] = [1]
  if (showLeftEllipsis) {
    pages.push('ellipsis')
  } else {
    // Fill the gap between 1 and the window with real page numbers
    for (let p = 2; p < left; p++) pages.push(p)
  }

  for (let p = left; p <= right; p++) {
    if (p !== 1 && p !== total) pages.push(p)
  }

  if (showRightEllipsis) {
    pages.push('ellipsis')
  } else {
    for (let p = right + 1; p < total; p++) pages.push(p)
  }

  pages.push(total)
  return pages
}
