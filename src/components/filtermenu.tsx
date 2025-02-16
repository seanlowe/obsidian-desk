import React, { ChangeEvent, useEffect, useRef } from 'react'
import { useState } from 'react'
import { keyOfFilter, filterEqual } from '../utils/filter'
import { FilterChip } from './filterchip'
import { SortChip } from './sortchip'
import { LampDesk } from 'lucide-react'
import { Filter, FilterMenuProps } from '../types'
import { MAX_SUGGESTIONS } from 'src/constants'

export function FilterMenu( props: FilterMenuProps ) {
  const [userInput, setUserInput] = useState( '' )
  const [showSuggestionsMenu, setShowSuggestionsMenu] = useState( false )
  const [showSuggestionsSpinner, setShowSuggestionsSpinner] = useState( true )
  const [filteredSuggestions, setFilteredSuggestions] = useState( props.suggestions )
  const [selectedSuggestion, setSelectedSuggestion] = useState( 0 )
  const textInputRef = useRef<HTMLInputElement>( null )

  // This state is only meant to forward the filters further down.
  // Actual filter list is in Desk component.
  const [filters, setFilters] = useState( props.filters )

  useEffect(() => {
    setFilters( props.filters )
  }, [props.filters] )

  useEffect(() => {
    if ( userInput !== '' ) {
      const timeout = setTimeout(() => {
        const suggestions = makeSuggestions( userInput )
        setFilteredSuggestions( suggestions )
        setShowSuggestionsSpinner( false )
      }, 300 )

      return () => {
        clearTimeout( timeout )
      }
    }
  }, [userInput] )

  function onTextChange( e: ChangeEvent<HTMLInputElement> ) {

    setShowSuggestionsSpinner( true )
    setUserInput( e.target.value )

    if ( e.target.value === '' ) {
      setShowSuggestionsMenu( false )
    } else {
      setShowSuggestionsMenu( true )
    }
  }

  function makeSuggestions( filterText: string ) {
    const textSuggestion: Filter = {
      type: 'text',
      value: filterText,
      reversed: false,
    }

    const otherSuggestions = props.suggestions.filter( s => {
      return s.value.toLowerCase().contains( filterText.toLowerCase()) && !filters.some(( a ) => {
        return filterEqual( a, s )
      })
    })

    return [textSuggestion, ...otherSuggestions]
  }

  function addSuggestion( f: Filter ) {
    props.addFilter( f )

    setUserInput( '' )
    setShowSuggestionsMenu( false )

    if ( textInputRef.current ) {
      textInputRef.current.focus()
    }
  }

  function selectSuggestion( index: number ) {
    setSelectedSuggestion( index )
  }

  function removeChip( index: number ) {
    props.removeFilter( index )
  }

  const onKeyDown = ( e: KeyboardEvent ) => {
    if ( userInput.length === 0 && e.key === 'Backspace' && e.target === textInputRef.current && filters.length > 0 ) {
      props.removeFilter( -1 )
    }

    if ( e.key === 'Enter' && e.target === textInputRef.current ) {
      addSuggestion( filteredSuggestions[selectedSuggestion] )
    }

    if ( e.key === 'Escape' && showSuggestionsMenu ) {
      if ( showSuggestionsMenu ) {
        setShowSuggestionsMenu( false )
        e.stopPropagation()
      }
    }

    if ( e.key === 'ArrowDown' ) {
      setSelectedSuggestion( Math.min( filteredSuggestions.length - 1, selectedSuggestion + 1 ))
    }

    if ( e.key === 'ArrowUp' ) {
      setSelectedSuggestion( Math.max( 0, selectedSuggestion - 1 ))
    }

    return false
  }

  useEffect(() => {
    if ( textInputRef.current ) {
      textInputRef.current.addEventListener( 'keydown', onKeyDown )
    }

    return () => {
      if ( textInputRef.current ) {
        textInputRef.current.removeEventListener( 'keydown', onKeyDown )
      }
    }
  })

  function suggestionDescription( filter: Filter ) {
    if ( filter.type === 'tag' ) {
      return <span>Has tag <FilterChip filter={filter} closeable={false} /></span>
    } else if ( filter.type === 'folder' ) {
      return <span>Is inside folder <FilterChip filter={filter} closeable={false} /></span>
    } else if ( filter.type === 'link' ) {
      return <span>Links to <FilterChip filter={filter} closeable={false} /></span>
    } else if ( filter.type === 'backlink' ) {
      return <span>Is linked by <FilterChip filter={filter} closeable={false} /></span>
    } else if ( filter.type === 'text' ) {
      return <span>Contains text <FilterChip filter={filter} closeable={false}></FilterChip></span>
    } else {
      throw new Error( 'Unknown filter type when generating description text.' )
    }
  }


  const suggestionComponents = filteredSuggestions.slice( 0, MAX_SUGGESTIONS ).map(( suggestion, index ) => {
    return <li key={keyOfFilter( suggestion )} className={'desk__dropdown-list-item'}>
      <a
        className={`${index === selectedSuggestion ? 'selected' : ''}`}
        onClick={() => {
          addSuggestion( suggestion )
        }}
        onMouseEnter={() => {
          selectSuggestion( index )
        }}
      >{suggestionDescription( suggestion )}</a>
    </li>
  })

  const chips = filters.map(( f, i ) => {
    return <FilterChip filter={f} onClick={() => {
      return props.reverseFilter( f )
    }} key={keyOfFilter( f )} closeable={true} onClose={() => {
      return removeChip( i )
    }} />
  })

  const suggestionList = <div>
    <ul className="desk__dropdown-list">
      {suggestionComponents}
    </ul>
    {filteredSuggestions.length >= MAX_SUGGESTIONS &&
      <p className="desk__dropdown-list-info"> Keep typing to show other suggestions </p>
    }
  </div>

  const suggestionContents = <div className='desk__dropdown'>
    {showSuggestionsSpinner ? 'Generating suggestions...' : suggestionList}
  </div>

  return (
    <div className='desk__filter-menu'>
      <LampDesk className='list-filter-icon' />
      <div className={'desk__autocomplete-search-box-container'}>
        <SortChip onChange={( s ) => {
          props.onSortChange( s )
        }} sort={props.sort} />
        {chips}
        <div className='desk__filter-search-container'>
          <input
            className='desk__search-box-container-input'
            type="text"
            value={userInput}
            onChange={onTextChange}
            placeholder='Filter by tag, link...'
            ref={textInputRef} ></input>
          {showSuggestionsMenu ? suggestionContents : null}
        </div>
      </div>
    </div>
  )
}
