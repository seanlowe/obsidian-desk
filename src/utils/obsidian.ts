import { App } from 'obsidian'
import { ExtendedMetadataCache } from '../types'
import { createContext } from 'react'

export function getMetadataCache( app: App ): ExtendedMetadataCache {
  return app.metadataCache as ExtendedMetadataCache
}

export const ObsidianContext = createContext<App | undefined>( undefined )
