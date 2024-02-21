import { SearchResult, DataviewFile } from '../types'
import { App } from 'obsidian'
import { getAPI, isPluginEnabled, DataviewApi } from 'obsidian-dataview'

export * from './obsidian'
export * from './filter'

export function dataviewFileToSearchResult( dvFile: DataviewFile ): SearchResult {
  return {
    title: dvFile.name,
    path: dvFile.path,
    size: dvFile.size,
    ctime: dvFile.ctime,
    mtime: dvFile.mtime,
    folder: dvFile.folder, // Dataview returns an empty string if no parent.
    backlinks: dvFile.inlinks.length
  }
}

export function getDataviewAPI( app: App ): DataviewApi {
  if ( isPluginEnabled( app )) {
    const api = getAPI( app )

    if ( api ) {
      return api
    }
  }

  throw new Error( 'Could not access Dataview API' )
}
