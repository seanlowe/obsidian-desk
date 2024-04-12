import { FC, MouseEvent } from 'react'
import { X } from 'lucide-react'

import { iconOfType } from '../constants'
import { FilterChipProps } from '../types'
import { keyOfFilter } from '../utils/filter'

const FilterChip: FC<FilterChipProps> = ( props ) => {
  const { filter, closeable, onClick, onClose } = props
  const IconType = iconOfType[filter.type]

  const onCloseClicked = ( e: MouseEvent ) => {
    if ( onClose !== undefined ) {
      e.stopPropagation()
      onClose( filter )
    }
  }

  const closeButton = <span onClick={onCloseClicked}>
    <X className="desk__chip-icon desk__chip-delete-icon" />
  </span>

  return (
    <span
      className={`desk__chip${filter.reversed ? ' reversed' : ''}`}
      onClick={( e ) => {
        return onClick !== undefined ? onClick( e ) : null
      }}
      key={keyOfFilter( filter )}
    >
      <IconType className="desk__chip-icon"/>
      {filter.value}
      {closeable && closeButton}
    </span>
  )
}

export default FilterChip
