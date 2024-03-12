import { SearchResult, SortOption, Sorter } from './types'

export const VIEW_TYPE_DESK = 'desk-view'
export const RESULTS_BATCH_SIZE = 20
export const MAX_SUGGESTIONS = 50

// idea: custom sorting options?
export const sortOptions: SortOption[] = [
  { label: 'Date Modified', type: 'modified_date', reverse: false },
  { label: 'Name', type: 'name', reverse: false },
  { label: 'Note size', type: 'size', reverse: false },
  { label: 'Number of backlinks', type: 'backlinks', reverse: true }
]


export const sorters: Sorter = {
  'modified_date': ( a: SearchResult, b: SearchResult ) => {
    return a.mtime.toMillis() - b.mtime.toMillis()
  },
  'name': ( a: SearchResult, b: SearchResult ) => {
    return a.title.localeCompare( b.title )
  },
  'size': ( a: SearchResult, b: SearchResult ) => {
    return a.size - b.size
  },
  'backlinks': ( a: SearchResult, b: SearchResult ) => {
    return a.backlinks - b.backlinks
  },
}
