import { Plugin } from 'obsidian'

import { VIEW_TYPE_DESK } from './constants'
import DeskView from './components/deskview'

class DeskPlugin extends Plugin {
  onload = async () => {
    await this.loadSettings()

    this.addRibbonIcon( 'lamp-desk', 'Create new desk', () => {
      this.activateView()
    })

    this.addCommand({
      id: 'create-desk',
      name: 'Create new desk',
      callback: () => {
        this.activateView()
      }
    })

    this.registerView( VIEW_TYPE_DESK, ( leaf ) => {
      return new DeskView( leaf, this.app )
    })
  }

  loadSettings = async () => {
    console.log( 'loading plugin: desk v2 (personal)' )
  }

  // async saveSettings() {
  // }

  activateView = async () => {
    let leaf = undefined

    const leavesOfType = this.app.workspace.getLeavesOfType( VIEW_TYPE_DESK )

    if ( leavesOfType.length === 0 ) {
      leaf = this.app.workspace.getLeaf( true )
      leaf.setViewState({
        type: VIEW_TYPE_DESK,
        active: true,
      })
    } else {
      leaf = leavesOfType[0]
    }

    this.app.workspace.revealLeaf( leaf )
  }
}

export default DeskPlugin
