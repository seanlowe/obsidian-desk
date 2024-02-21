import { DateTime } from 'luxon/src/datetime'
import { MouseEventHandler } from 'react'
import { MetadataCache } from 'obsidian'

/* ------------------------------ */
/*           Interfaces           */
/* ------------------------------ */

export interface SearchResult {
  title: string
  path: string
  size: number
  ctime: DateTime
  mtime: DateTime
  folder: string
  backlinks: number
}

export interface DataviewFile {
  ctime: DateTime,
  mtime: DateTime,
  name: string,
  path: string,
  size: number,
  folder: string,
  inlinks: unknown[]
}

export interface DeskComponentState {
  filters: Filter[]
  sort: MaybeSortOption
}

export interface BasicFilter {
  type: 'tag' | 'folder' | 'backlink'
  value: string
  reversed: boolean
}

export interface TextFilter {
  type: 'text',
  value: string,
  reversed: boolean
}

export interface LinkFilter {
  type: 'link'
  value: string
  reversed: boolean
  exists: boolean
  alias?: string
}

export interface FilterChipProps {
  filter: Filter,
  onClick?: MouseEventHandler,
  closeable?: boolean
  onClose?: ( filter: Filter ) => void
}

export interface FilterMenuProps {
  filters: Filter[]
  suggestions: Filter[]
  addFilter: ( newFilter: Filter ) => void
  removeFilter: ( index: number ) => void
  reverseFilter: ( filter: Filter ) => void
  onSortChange: ( sortOption: MaybeSortOption ) => void
  sort: MaybeSortOption
}

export interface NoteCardProps {
  path: string,
  title: string,
  folder: string,
  backlinks: number,
  date: DateTime
  setFilters: ( filters: Filter[] ) => void
}

export interface TagMetadata {
  [key: string]: number
}

export interface LinkSuggestion {
  file: unknown,
  path: string,
}

export interface ExtendedMetadataCache extends MetadataCache {
  getTags(): TagMetadata
  getLinkSuggestions(): LinkSuggestion[]
}

export interface SearchResultsProps {
  results: SearchResult[]
  addFilter: ( filter: Filter ) => void
  setFilters: ( filters: Filter[] ) => void
}

export interface SortChipProps {
  onChange: ( sortOption: MaybeSortOption ) => void
  sort: MaybeSortOption
}

export interface SortOption {
  label: string,
  type: 'modified_date' | 'name' | 'size' | 'backlinks',
  reverse: boolean,
}

export interface DeskIndex {
  links: Map<string, string>
}

/* ------------------------------ */
/*              Types             */
/* ------------------------------ */

export type MaybeSortOption = SortOption | null
export type Filter = BasicFilter | LinkFilter | TextFilter
