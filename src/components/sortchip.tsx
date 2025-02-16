import React, { useEffect, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, X } from 'lucide-react'
import { SortOption, SortChipProps } from 'src/types'

const sortOptions: SortOption[] = [
  { label: 'Date Modified', type: 'modified_date', reverse: false },
  { label: 'Name', type: 'name', reverse: false },
  { label: 'Note size', type: 'size', reverse: false },
  { label: 'Number of backlinks', type: 'backlinks', reverse: true }
]

export function SortChip( props: SortChipProps ) {
  const [showDropdown, setShowDropdown] = useState( false )
  const dropdownRef = useRef<HTMLDivElement>( null )

  useEffect(() => {
    const handler = ( ev: MouseEvent ) => {
      if ( dropdownRef.current ) {
        const target = ev.target as HTMLDivElement
        if ( showDropdown && !dropdownRef.current.contains( target )) {
          setShowDropdown( false )
        }
      }
    }

    window.addEventListener( 'click', handler )

    return () => {
      window.removeEventListener( 'click', handler )
    }

  }, [showDropdown] )

  function onClick( e: React.MouseEvent ) {
    e.stopPropagation()

    if ( props.sort !== null ) {
      props.onChange({
        ...props.sort,
        reverse: !props.sort.reverse
      })
    } else {
      setShowDropdown( !showDropdown )
    }
  }

  function optionClicked( sortOption: SortOption ) {
    props.onChange( sortOption )
    setShowDropdown( false )
  }

  const sortOptionsButtons = sortOptions.map(( so ) => {
    return <li
      className='desk__dropdown-list-item'
      key={so.label}
      onClick={() => {
        optionClicked( so )
      }}>
      <a>{so.label}</a>
    </li>
  })

  const dropdown = <div className='desk__dropdown' ref={dropdownRef}>
    <ul className='desk__dropdown-list'>
      {sortOptionsButtons}
    </ul>
  </div>

  const orderIcon = props.sort
    && !props.sort.reverse
    ? <ArrowDownAZ className="desk__chip-icon" />
    : <ArrowUpAZ className="desk__chip-icon" />


  return <div className='desk__sort-chip-container'>
    <span className={`desk__chip ${props.sort === null ? 'empty' : ''}`} onClick={( e ) => {
      onClick( e )
    }}>
      {props.sort === null ? 'Sort by...' : <span> {orderIcon}{props.sort.label}</span>}
      {props.sort === null ? <ChevronDown className="desk__chip-icon" /> : <X className="desk__chip-icon" onClick={( e ) => {
        e.stopPropagation()
        props.onChange( null )
      }} />}
    </span>
    {showDropdown ? dropdown : null}
  </div>
}
