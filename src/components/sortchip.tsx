import React, { FC, useEffect, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowDownUp, ArrowUpAZ, ChevronDown, X } from 'lucide-react'

import { sortOptions } from '../constants'
import { SortOption, SortChipProps } from '../types'

const SortChip: FC<SortChipProps> = ( props ) => {
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
    return (
      <li
        className='desk__dropdown-list-item'
        key={so.label}
        onClick={() => {
          optionClicked( so )
        }}>
        <a>{so.label}</a>
      </li>
    )
  })

  let orderIcon = <ArrowDownUp className="desk__chip-icon" />
  if ( props.sort ) {
    if ( !props.sort.reverse ) {
      orderIcon = <ArrowDownAZ className="desk__chip-icon" />
    } else {
      orderIcon = <ArrowUpAZ className="desk__chip-icon" />
    }
  }

  return (
    <div className='desk__sort-chip-container'>
      <span
        className={'desk__chip'}
        onClick={onClick}
      >
        <span className='desk__chip-label'> {orderIcon}{props.sort?.label ?? 'Sort'}</span>
        {props.sort === null
          ? <ChevronDown className="desk__chip-icon" />
          : <X className="desk__chip-icon"
            onClick={( e ) => {
              e.stopPropagation()
              props.onChange( null )
            }}
          />}
      </span>
      {showDropdown && (
        // SEANTODO: make the classname specific to sort options dropdown
        <div className='desk__dropdown' ref={dropdownRef}>
          <ul className='desk__dropdown-list'>
            {sortOptionsButtons}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SortChip
