import { FC, MouseEvent } from 'react'
import { Folder, CaseLower, X, Tag, FileInput, FileOutput } from 'lucide-react'

import { FilterChipProps } from '../types'
import { keyOfFilter } from '../utils/filter'

const iconOfType = {
  'folder': Folder,
  'link': FileOutput,
  'tag': Tag,
  'text': CaseLower,
  'backlink': FileInput,
}

const FilterChip: FC<FilterChipProps> = ( props ) => {
  const IconType = iconOfType[props.filter.type]

  const onCloseClicked = ( e: MouseEvent ) => {
    if ( props.onClose !== undefined ) {
      e.stopPropagation()
      props.onClose( props.filter )
    }
  }

  const closeButton = <span onClick={onCloseClicked}>
    <X className="desk__chip-icon desk__chip-delete-icon" />
  </span>

  return (
    <span
      className={`desk__chip${props.filter.reversed ? ' reversed' : ''}`}
      onClick={( e ) => {
        return props.onClick !== undefined ? props.onClick( e ) : null
      }}
      key={keyOfFilter( props.filter )}>
      <IconType className="desk__chip-icon"/>
      {props.filter.value}
      {props.closeable ?  closeButton : null}
    </span>
  )
}

export default FilterChip
