import { Plugin } from 'obsidian'

import { VIEW_TYPE_DESK } from './constants'
import DeskView from './components/deskview'
import { AwaitedDvApiMessage, waitForDataview } from './utils'

class DeskPlugin extends Plugin {
  dataviewPlugin: AwaitedDvApiMessage

  onload = async () => {
    await this.loadSettings()

    this.app.workspace.onLayoutReady( async () => {
      console.log( 'on layout ready' )

      // don't do shit until dataview is ready
      while (
        !['index-ready', 'initialized'].includes( this.dataviewPlugin?.status )
      ) {
        console.log( 'waiting for dataview', this.dataviewPlugin )
        this.dataviewPlugin = await waitForDataview( this )
      }

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
    })

  }

  loadSettings = async () => {
    console.log( 'loading plugin: desk v2 (personal)' )
  }

  // async saveSettings() {
  // }

  // example saving data to a file
  //   async saveData(data: Record<any, any>) {
  //     if (this.configDirectory) {
  //         try {
  //             if (
  //                 !(await this.app.vault.adapter.exists(this.configDirectory))
  //             ) {
  //                 await this.app.vault.adapter.mkdir(this.configDirectory);
  //             }
  //             await this.app.vault.adapter.write(
  //                 this.configFilePath,
  //                 JSON.stringify(data)
  //             );
  //         } catch (e) {
  //             console.error(e);
  //             new Notice(
  //                 t(
  //                     "There was an error saving into the configured directory."
  //                 )
  //             );
  //         }
  //     }
  //     await super.saveData(data);
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

    if ( this.dataviewPlugin ) {
      this.app.workspace.revealLeaf( leaf )
    }
  }
}

export default DeskPlugin
