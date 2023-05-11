import * as React from 'react'
import { produce } from 'immer'


import { AutocompleteSearchBox as FilterMenu } from './autocomplete'
import { BacklinkFilter, Filter, FolderFilter, LinkFilter, filtersToDataviewQuery } from './filter'
import { ResultsDisplay, SearchResult } from './results'






interface DeskViewState {
    results: SearchResult[]
    suggestions: Filter[]
    filters: Filter[]
}

export default class DeskComponent extends React.Component {
    state: DeskViewState

    constructor(props: never) {
        super(props)

        this.state = {
            results: app.vault.getMarkdownFiles().map((t) => {
                return {
                key: t.path,
                title: t.basename,
                path: t.path,
                body: ""
            }}),
            filters: [],
            suggestions: this.getAllSuggestions()
        }
    }

    getAllSuggestions(): Filter[] {
        const suggestions = [
            ...this.getTagSuggestions(), 
            ...this.getLinkSuggestions(), 
            ...this.getFolderSuggestions(), 
            ...this.getBacklinkSuggestions()
        ]
        return suggestions.sort((a, b) => a.value.length - b.value.length)
    }

    getTagSuggestions(): Filter[] {
        return Object.keys(app.metadataCache.getTags()).map((t) => {return {type: "tag", value: t, key: t}})
    }

    getFolderSuggestions(): FolderFilter[] {
        const folderPaths = app.vault.getAllLoadedFiles().filter(f => ('children' in f) && f.path !== '/').map(f => f.path)
        return folderPaths.map((p) => {
            return {
                type: 'folder',
                value: p,
                key: p,
            }
        })
    }

    getLinkSuggestions(): LinkFilter[] {
        return app.metadataCache.getLinkSuggestions().map((s: any) =>{
            const filter: LinkFilter = {type: "link", value: s.path, exists: s.file !== null}

            if ('alias' in s) {
                filter.alias = s.alias
            }

            return filter
        })
    }

    getBacklinkSuggestions(): BacklinkFilter[] {
        const dv = app.plugins.getPlugin('dataview').api

        const allPages = dv.pages('""').values

        const withBacklinks = allPages.map(p => p.file).filter((p: any) => p.outlinks.length > 0).map((p: any) => {
            return {
                type: "backlink",
                value: p.path,
                key: p.path
            }
        })
        return withBacklinks
    }

    onQueryChange(filters: Filter[]) {
        const dv = app.plugins.plugins.dataview.api
        const dataviewQuery = filtersToDataviewQuery(filters)

        const pages = dv.pages(dataviewQuery)

        const newState = produce(this.state, draft => {
            draft.results = pages.map((p: any) => {
                return {
                    title: p.file.name,
                    key: p.file.path,
                    path: p.file.path,
                    body: "",
                }
            })
        })
        this.setState(newState)
    }

    render() {
        return <div className="desk__root">
            <div className='desk__search-menu'>
                <div className='desk__text-search-input-container'>
                    <input type="text" placeholder='Search text' />
                </div>
                <FilterMenu suggestions={this.state.suggestions} onChange={(newFilters) => this.onQueryChange(newFilters)} />
            </div>
            <ResultsDisplay results={this.state.results}></ResultsDisplay>
        </div>
    }


}