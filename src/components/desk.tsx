import { useState, useEffect, useContext, FC, useCallback } from 'react'
import { produce } from 'immer'
import { TFile, App } from 'obsidian'

import FilterMenu from './filtermenu'
import ResultsDisplay from './results'

import { sortOptions, sorters } from '../constants'
import {
  SearchResult,
  Filter,
  BasicFilter,
  ExtendedMetadataCache,
  LinkFilter,
  MaybeSortOption,
  TextFilter,
  LinkSuggestion,
  SortOption
} from '../types'
import {
  dataviewFileToSearchResult,
  ObsidianContext,
  getMetadataCache,
  filterEqual,
  filtersToDataviewQuery
} from '../utils'
import { DataviewApi, SMarkdownPage } from 'obsidian-dataview'

function getTagSuggestions( app: App ): Filter[] {
  const metadataCache = getMetadataCache( app )
  return Object.keys( metadataCache.getTags()).map(( t ) => {
    return { type: 'tag', value: t, key: t, reversed: false }
  })
}

function getFolderSuggestions( app: App ): BasicFilter[] {
  const folderPaths = app.vault.getAllLoadedFiles().filter( f => {
    return ( 'children' in f ) && f.path !== '/'
  }).map( f => {
    return f.path
  })
  return folderPaths.map(( p ) => {
    return {
      type: 'folder',
      value: p,
      key: p,
      reversed: false,
    }
  })
}

function getLinkSuggestions( app: App ): LinkFilter[] {
  const metadataCache = app.metadataCache as ExtendedMetadataCache

  return metadataCache.getLinkSuggestions().map(( s: LinkSuggestion ) => {
    const filter: LinkFilter = { type: 'link', value: s.path, exists: s.file !== null, reversed: false }

    if ( 'alias' in s ) {
      filter.alias = String( s.alias )
    }

    return filter
  })
}

const getBacklinkSuggestions = ( allPages: SMarkdownPage[] ): BasicFilter[] => {
  const files = allPages.filter(( page: SMarkdownPage ) => {
    return page?.file?.outlinks?.length > 0
  }).map(( page: SMarkdownPage ) => {
    const filter: BasicFilter = {
      type: 'backlink' as const,
      value: page.path ?? '',
      reversed: false,
    }

    return filter
  })

  return files
}

function getAllSuggestions( app: App, pages: SMarkdownPage[] ): Filter[] {
  const suggestions = [
    ...getTagSuggestions( app ),
    ...getLinkSuggestions( app ),
    ...getFolderSuggestions( app ),
    ...getBacklinkSuggestions( pages ),
  ]

  const suggestionOrder = ( a: Filter, b: Filter ) => {
    return a.value?.length - b.value?.length
  }

  return suggestions.sort( suggestionOrder )
}

const DeskComponent: FC<{dv: DataviewApi, pages: SMarkdownPage[]}> = ({ dv, pages: initialPages }) => {
  const app = useContext( ObsidianContext )
  if ( !app ) throw new Error( 'no app' )

  const [sort, setSort] = useState<MaybeSortOption>( sortOptions[0] )
  const [suggestions, setSuggestions] = useState<Filter[]>( [] )
  const [filters, setFilters] = useState<Filter[]>( [] )
  const [pages, setPages] = useState( initialPages )

  // Not intended to be set directly. The idea is to set the filters and the sort.
  // Then, the effect listening on state should update the search result list.
  // We need that little hoop because we need to filter the results in an async manner.
  const [searchResults, setSearchResults] = useState<SearchResult[]>( [] )

  /* ------------------------------ */
  /*     State Helper Functions     */
  /* ------------------------------ */

  const filterPages = ( query = '""' ) => {
    let pages = []
    if ( dv !== null ) {
      pages = dv?.pages( query ).values
    }

    setPages( pages )
    return pages
  }

  const filterBasedOnSort = useCallback( async () => {
    console.log( 'filterBasedOnSort' )
    const unfilteredSearchResults = await generateResults()

    // Text filters need to be applied manually, they
    // cannot be realized with only a Dataview page query.
    const textFilters = filters.filter( f => {
      return f.type === 'text'
    }) as TextFilter[]

    const maskPromise = unfilteredSearchResults.map(( p ) => {
      return applyTextFilters( p.path, textFilters )
    })

    Promise.all( maskPromise ).then(( mask ) => {
      // figure out how to do this via setting the
      // `filters` and `sort` state variables
      setSearchResults( unfilteredSearchResults.filter(( v, i ) => {
        return mask[i]
      }))
    })
  }, [filters, sort] )

  useEffect(() => {
    filterBasedOnSort()
  }, [] )

  useEffect(() => {
    setSuggestions( getAllSuggestions( app, initialPages ))
  }, [dv] )


  useEffect(() => {
    const createListenerEventRef = app.vault.on( 'create', () => {
      setSuggestions( getAllSuggestions( app, pages ))
    })

    return () => {
      app.vault.offref( createListenerEventRef )
    }
  }, [pages] )

  const onSortChange = ( sortOption: MaybeSortOption ) => {
    setSort( produce( sort, () => {
      return sortOption
    }))
  }

  const onAddFilter = ( newFilter: Filter ) => {
    const filterAlreadyExists = filters.some(( filter ) => {
      return filterEqual( newFilter, filter )
    })

    if ( filterAlreadyExists ) {
      return
    }

    const newFilterState = [...filters, newFilter]
    setFilters( newFilterState )

  }

  const onSetFilters = ( filters: Filter[] ) => {
    setFilters( filters )
  }

  const onRemoveFilter = ( index: number ) => {
    const newFilterList = filters.slice()
    newFilterList.splice( index, 1 )

    setFilters( newFilterList )
  }

  const reverseFilter = ( filter: Filter ) => {
    const newFilters = [...filters]
    const filterIndex = filters.indexOf( filter )
    newFilters[filterIndex] = {
      ...filter,
      reversed: !filter.reversed
    }

    setFilters( newFilters )
  }

  const generateResults = async (): Promise<SearchResult[]> => {
    if ( !app ) throw new Error( 'no app' )

    const dataviewQuery = filtersToDataviewQuery( filters.filter( f => {
      return f.type !== 'text'
    }))
    filterPages( dataviewQuery )

    if ( !sort ) {
      throw new Error( 'sort is missing' )
    }

    const sortFunction = sorters[sort.type] ?? sorters.modified_date
    const reversedSortFunction = sort.reverse ? ( a: SearchResult, b: SearchResult ) => {
      return sortFunction( b, a )
    } : sortFunction

    const results = pages.map(({ file }) => {
      return dataviewFileToSearchResult( file )
    }).sort( reversedSortFunction )

    return results
  }

  const applyTextFilters = async ( path: string, filters: TextFilter[] ): Promise<boolean> => {
    if ( !app ) throw new Error( 'no app' )

    const fileHandle = app.vault.getAbstractFileByPath( path )

    if ( fileHandle instanceof TFile ) {
      const fileContent = await app.vault.cachedRead( fileHandle )

      for ( const f of filters ) {
        if ( f.reversed === fileContent.contains( f.value )) {
          // If reversed is equal to contains, then the file does not match the filter.
          return false
        }
      }

      return true
    }

    throw new Error( 'unexpected type when reading file' )
  }

  return (
    <div className='desk__root'>
      <div className='desk__search-menu'>
        <FilterMenu
          filters={filters}
          suggestions={suggestions}
          sort={sort}
          onSortChange={( sortOption: SortOption ) => {
            return onSortChange( sortOption )
          }}
          addFilter={( f: Filter ) => {
            onAddFilter( f )
          }}
          removeFilter={( i: number ) => {
            onRemoveFilter( i )
          }}
          reverseFilter={( f: Filter ) => {
            reverseFilter( f )
          }} />
      </div>
      <ResultsDisplay
        results={searchResults}
        addFilter={( f ) => {
          onAddFilter( f )
        }}
        setFilters={( f ) => {
          onSetFilters( f )
        }}
      />
    </div>
  )
}

export default DeskComponent
