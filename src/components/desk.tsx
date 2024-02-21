import React, { useState, useEffect, useContext } from 'react'
import { produce } from 'immer'
import { TFile, App } from 'obsidian'

import {
  dataviewFileToSearchResult,
  getDataviewAPI,
  ObsidianContext,
  getMetadataCache,
  filterEqual,
  filtersToDataviewQuery
} from '../utils'
import {
  DeskComponentState,
  DataviewFile,
  SearchResult,
  Filter,
  BasicFilter,
  ExtendedMetadataCache,
  LinkFilter,
  MaybeSortOption,
  TextFilter,
  LinkSuggestion
} from '../types'
import { FilterMenu } from './filtermenu'
import { ResultsDisplay } from './results'

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

function getBacklinkSuggestions( app: App ): BasicFilter[] {
  const dv = getDataviewAPI( app )
  const allPages = dv.pages( '""' ).values

  const withBacklinks = allPages.map(( p: any ) => {
    return p.file
  }).filter(( p: any ) => {
    return p.outlinks.length > 0
  }).map(( p: any ) => {
    return {
      type: 'backlink',
      value: p.path,
      key: p.path
    }
  })
  return withBacklinks
}


function getAllSuggestions( app: App ): Filter[] {
  const suggestions = [
    ...getTagSuggestions( app ),
    ...getLinkSuggestions( app ),
    ...getFolderSuggestions( app ),
    ...getBacklinkSuggestions( app ),
  ]

  const suggestionOrder = ( a: Filter, b: Filter ) => {
    return a.value.length - b.value.length
  }

  return suggestions.sort( suggestionOrder )
}

export function DeskComponent() {
  const [state, setState] = useState<DeskComponentState>({
    filters: [],
    sort: null,
  })

  const app = useContext( ObsidianContext )
  if ( !app ) throw new Error( 'no app' )

  const [suggestions, setSuggestions] = useState<Filter[]>( getAllSuggestions( app ))

  // Was not intended to be set directly. The idea is to set the filters and the sort.
  // Then, the effect listening on state should update the search result list.
  // We need that little hoop because we need to filter the results in an async manner.
  const [searchResults, setSearchResults] = useState<SearchResult[]>( [] )

  useEffect(() => {
    const createListenerEventRef = app.vault.on( 'create', () => {
      setSuggestions( getAllSuggestions( app ))
    })

    return () => {
      app.vault.offref( createListenerEventRef )
    }
  })

  useEffect(() => {
    const unfilteredSearchResults = generateResults()

    // Text filters need to be applied manually, they cannot be realized only with a Dataview page query.
    const textFilters = state.filters.filter( f => {
      return f.type === 'text'
    }) as TextFilter[]
    const maskPromise = unfilteredSearchResults.map(( p ) => {
      return applyTextFilters( p.path, textFilters )
    })

    Promise.all( maskPromise ).then(( mask ) => {
      setSearchResults( unfilteredSearchResults.filter(( v, i ) => {
        return mask[i]
      }))
    })
  }, [state] )

  function onSortChange( sortOption: MaybeSortOption ) {
    setState( produce( state, draft => {
      draft.sort = sortOption
    }))
  }

  function onAddFilter( filter: Filter ) {
    if ( !state.filters.some( f => {
      return filterEqual( filter, f )
    })) {
      const newState = {
        ...state,
        filters: [...state.filters, filter],
      }

      setState( newState )
    }
  }

  function onSetFilters( filters: Filter[] ) {
    const newState = {
      ...state,
      filters: filters
    }

    setState( newState )
  }

  function onRemoveFilter( index: number ) {
    const newFilterList = state.filters.slice()
    newFilterList.splice( index, 1 )

    const newState = {
      ...state,
      filters: newFilterList,
    }

    setState( newState )
  }

  function reverseFilter( filter: Filter ) {
    const newFilters = state.filters.slice()

    const filterIndex = state.filters.indexOf( filter )
    newFilters[filterIndex] = {
      ...filter,
      reversed: !filter.reversed
    }

    setState({
      ...state,
      filters: newFilters
    })
  }

  function generateResults(): SearchResult[] {
    if ( !app ) throw new Error( 'no app' )

    const dv = getDataviewAPI( app )
    const dataviewQuery = filtersToDataviewQuery( state.filters.filter( f => {
      return f.type !== 'text'
    }))

    const sorters: { [key: string]: ( a: SearchResult, b: SearchResult ) => number } = {
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

    const sortFunction = state.sort ? sorters[state.sort.type] : sorters.modified_date
    const reversedSortFunction = state.sort && state.sort.reverse ? ( a: SearchResult, b: SearchResult ) => {
      return sortFunction( b, a )
    } : sortFunction

    const pages: { file: DataviewFile }[] = dv.pages( dataviewQuery ).values

    const results = pages.map(({ file }) => {
      return dataviewFileToSearchResult( file )
    }).sort( reversedSortFunction )

    return results
  }

  async function applyTextFilters( path: string, filters: TextFilter[] ): Promise<boolean> {
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

  return <div className="desk__root">
    <div className='desk__search-menu'>
      <FilterMenu
        filters={state.filters}
        suggestions={suggestions}
        sort={state.sort}
        onSortChange={( sortOption ) => {
          return onSortChange( sortOption )
        }}
        addFilter={( f ) => {
          onAddFilter( f )
        }}
        removeFilter={( i: number ) => {
          onRemoveFilter( i )
        }}
        reverseFilter={( f ) => {
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
      }} />
  </div>
}
