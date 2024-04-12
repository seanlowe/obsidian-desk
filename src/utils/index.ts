import { App } from 'obsidian'
import { getAPI, isPluginEnabled, DataviewApi } from 'obsidian-dataview'

import DeskPlugin from 'src/main'
import { SearchResult, DataviewFile, AwaitedDvApiMessage } from '../types'

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

// credit to: @SkepticMystic:
// https://github.com/SkepticMystic/breadcrumbs/blob/00205750c658beef372a0ce498359b37dee7004d/src/external/dataview/index.ts#L7
export const waitForDataview = ( plugin: DeskPlugin ): Promise<AwaitedDvApiMessage> => {
  return new Promise<AwaitedDvApiMessage>(( resolve ) => {
    const result: AwaitedDvApiMessage = {
      dvApi: null,
      status: 'not-enabled'
    }

    if ( isPluginEnabled( plugin.app )) {
      const api = getAPI( plugin.app )
      if ( api?.index.initialized ) {
        console.log( 'dataview is initialized.' )
        result.dvApi = api
        result.status = 'initialized'
        resolve( result )
      }

      plugin.registerEvent(
        plugin.app.metadataCache.on(
          // @ts-expect-error - if dataview is enabled, this event will exist.
          'dataview:index-ready',
          () => {
            console.log( 'dataview:index-ready' )
            result.dvApi = api
            result.status = 'index-ready'
            resolve( result )
          },
        ),
      )
    } else {
      console.log( 'dataview is not enabled.' )
      resolve( result )
    }
  })
}
