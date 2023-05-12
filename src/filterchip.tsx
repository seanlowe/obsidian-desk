import React, { MouseEventHandler } from 'react'
import {Filter, keyOfFilter} from './filter'
import { Folder, CaseLower, X, Tag, FileInput, FileOutput } from 'lucide-react'

interface FilterChipProps {
    filter: Filter,
    onClick?: MouseEventHandler,
    closeable?: boolean
}

const iconOfType = {
    'folder': Folder,
    'link': FileInput,
    'tag': Tag,
    'text': CaseLower,
    'backlink': FileOutput,
}

export function FilterChip(props: FilterChipProps) {
    const IconType = iconOfType[props.filter.type]

    return <span className="desk__chip" onClick={(e) => props.onClick !== undefined ? props.onClick(e) : null} key={keyOfFilter(props.filter)}>
            <IconType className="desk__chip-icon"/>
            {props.filter.value}
            {props.closeable ? <X className="desk__chip-icon desk__chip-delete-icon" /> : null}
        </span>
}