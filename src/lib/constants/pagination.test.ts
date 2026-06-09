import { describe, it, expect } from 'vitest'
import {
  getTotalPages,
  parsePageParam,
  getSkip,
  getPageNumbers,
} from './pagination'

describe('getTotalPages', () => {
  it('returns 1 for an empty list', () => {
    expect(getTotalPages(0, 21)).toBe(1)
  })

  it('returns 1 when total fits in a single page', () => {
    expect(getTotalPages(21, 21)).toBe(1)
  })

  it('rounds up partial pages', () => {
    expect(getTotalPages(22, 21)).toBe(2)
    expect(getTotalPages(43, 21)).toBe(3)
  })
})

describe('parsePageParam', () => {
  it('defaults to 1 for undefined / non-numeric / junk', () => {
    expect(parsePageParam(undefined, 5)).toBe(1)
    expect(parsePageParam('abc', 5)).toBe(1)
    expect(parsePageParam('1.5', 5)).toBe(1)
    expect(parsePageParam('', 5)).toBe(1)
  })

  it('clamps values below 1 up to 1', () => {
    expect(parsePageParam('0', 5)).toBe(1)
    expect(parsePageParam('-3', 5)).toBe(1)
  })

  it('clamps values above totalPages down to totalPages', () => {
    expect(parsePageParam('99', 5)).toBe(5)
  })

  it('passes through valid in-range pages', () => {
    expect(parsePageParam('3', 5)).toBe(3)
  })
})

describe('getSkip', () => {
  it('returns 0 for page 1', () => {
    expect(getSkip(1, 21)).toBe(0)
  })

  it('multiplies (page - 1) by perPage', () => {
    expect(getSkip(2, 21)).toBe(21)
    expect(getSkip(4, 10)).toBe(30)
  })
})

describe('getPageNumbers', () => {
  it('lists every page when total is small', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('shows a right ellipsis near the start', () => {
    expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10])
  })

  it('shows a left ellipsis near the end', () => {
    expect(getPageNumbers(9, 10)).toEqual([1, 'ellipsis', 8, 9, 10])
  })

  it('shows both ellipses in the middle', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })

  it('always includes first and last page', () => {
    const pages = getPageNumbers(5, 20)
    expect(pages[0]).toBe(1)
    expect(pages[pages.length - 1]).toBe(20)
  })
})
