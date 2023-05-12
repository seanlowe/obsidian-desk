import React, { ChangeEvent, useEffect, useRef } from 'react'
import { useState } from 'react'
import { Filter, keyOfFilter } from './filter'
import { FilterChip } from './filterchip'
import { SortChip } from './sortchip'
import { ListFilter } from 'lucide-react'
import {MaybeSortOption} from './sortchip'

const MAX_SUGGESTIONS = 50

interface FilterMenuProps {
    filters: Filter[]
    suggestions: Filter[]
    addFilter: (newFilter: Filter) => void
    removeFilter: (index: number) => void
    onSortChange: (sortOption: MaybeSortOption) => void
}

export function FilterMenu(props: FilterMenuProps) {
    const [userInput, setUserInput] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [filteredSuggestions, setFilteredSuggestions] = useState(props.suggestions)
    const [selectedSuggestion, setSelectedSuggestion] = useState(0)
    const textInputRef = useRef<HTMLInputElement>(null)

    function onTextChange(e: ChangeEvent<HTMLInputElement>) {
        setUserInput(e.target.value)
        setShowSuggestions(true)
        setFilteredSuggestions(
            props.suggestions.filter(s => s.value.toLowerCase().contains(e.target.value.toLowerCase()) && !props.filters.contains(s))
        )
    }

    function addSuggestion(f: Filter) {
        props.addFilter(f)

        setUserInput('')
        setShowSuggestions(false)

        if(textInputRef.current) {
            textInputRef.current.focus()
        }
    }

    function selectSuggestion(index: number) {
        setSelectedSuggestion(index)
    }

    function removeChip(index: number) {
        props.removeFilter(index)
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if(userInput.length === 0 && e.key === "Backspace" && e.target === textInputRef.current) {
            props.removeFilter(-1)
        }

        if(e.key === "Enter" && e.target === textInputRef.current) {
            addSuggestion(filteredSuggestions[selectedSuggestion])
        }

        return false
    }

    useEffect(() => {
        if (textInputRef.current) {
            textInputRef.current.addEventListener('keydown', onKeyDown)
        }
        
        return () => { 
            if(textInputRef.current) {
                textInputRef.current.removeEventListener('keydown',onKeyDown) 
            }
        }
    })

    function suggestionDescription(filter: Filter) {
        if (filter.type === "tag") {
            return <span>Has tag <FilterChip filter={filter} closeable={false} /></span>;
        } else if (filter.type === "folder") {
            return <span>Is inside folder <FilterChip filter={filter} closeable={false} /></span>;
        } else if (filter.type === "link") {
            return <span>Links to <FilterChip filter={filter} closeable={false} /></span>;
        } else if (filter.type === "backlink") {
            return <span>Is linked by <FilterChip filter={filter} closeable={false} /></span>
        } else { 
            throw new Error("Unknown filter type when generating description text.")
        }
    }

    const suggestionComponents = filteredSuggestions.slice(0, MAX_SUGGESTIONS).map((suggestion, index) => { 
        return <li key={keyOfFilter(suggestion)} className={`desk__dropdown-list-item`}>
            <a 
            className={`${index === selectedSuggestion ? 'selected' : ''}`}
            onClick={() => {addSuggestion(suggestion)}}
            onMouseEnter={() => {selectSuggestion(index)}}
            >{suggestionDescription(suggestion)}</a>
        </li>
    })

    const chips = props.filters.map((f, i) =>{
        return <FilterChip filter={f} onClick={() => removeChip(i)} key={keyOfFilter(f)} closeable={true} />
    })

    const suggestionList = <div>
        <ul className="desk__dropdown-list">{suggestionComponents}</ul>
        {filteredSuggestions.length >= MAX_SUGGESTIONS ? <p className="desk__dropdown-list-info">Keep typing to show other suggestions</p> : null}
    </div>

    const suggestionContents = <div className='desk__dropdown'>
        { filteredSuggestions.length > 0 ? suggestionList : <p>No filter match your query</p> }
    </div>

    return (
        <div className='desk__filter-menu'>
            <ListFilter className='list-filter-icon' />
            <div className={`desk__autocomplete-search-box-container`}>
                <SortChip onChange={(s) => {props.onSortChange(s)}}/>
                {chips}
                <div className='desk__filter-search-container'>
                    <input 
                        className='desk__search-box-container-input' 
                        type="text" 
                        value={userInput} 
                        onChange={onTextChange}
                        placeholder='Filter by tag, link...'
                        ref={textInputRef} ></input>
                    { showSuggestions ? suggestionContents : null}
                </div>
            </div>
        </div>
    )
}