import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ItemView, WorkspaceLeaf, Vault, App, KeymapEventHandler, Scope } from 'obsidian'

import { VIEW_TYPE_DESK } from '../constants'
import { DeskComponent } from './desk'
import { ExtendedMetadataCache } from '../types'
import { ObsidianContext } from '../utils/obsidian'

export class DeskView extends ItemView {
  vault: Vault
  metadataCache: ExtendedMetadataCache
  results: Array<string>
  root: Root
  escapeHandler: KeymapEventHandler | null
  scope: Scope

  constructor( leaf: WorkspaceLeaf, app: App ) {
    super( leaf )
    this.app = app
    this.vault = app.vault
    this.metadataCache = app.metadataCache as ExtendedMetadataCache
    this.escapeHandler = null

    this.scope = new Scope( this.app.scope )
  }

  getViewType() {
    return VIEW_TYPE_DESK
  }

  getDisplayText() {
    return 'Desk'
  }

  onOpen = async () => {
    // Handle escape so that I can implement my own behavior later.
    this.escapeHandler = this.scope.register( [], 'Escape', () => {
      console.log( 'Escape' )
    })

    const container = this.containerEl.children[1]

    this.root = createRoot( container )
    this.root.render(
      <React.StrictMode>
        <ObsidianContext.Provider value={this.app}>
          <DeskComponent />
        </ObsidianContext.Provider>
      </React.StrictMode>
    )
  }

  onClose = async () => {
    if ( this.root ) this.root.unmount()
  }
}
