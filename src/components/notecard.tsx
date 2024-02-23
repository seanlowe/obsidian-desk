import { useContext, useState, useEffect, useRef, FC } from 'react'
import { App, TFile, MarkdownRenderer } from 'obsidian'
import { Clock, FileInput, Folder } from 'lucide-react'
import { DateTime } from 'luxon'
import * as _ from 'lodash'

import { NoteCardProps } from '../types'
import { ObsidianContext } from '../utils'

function navigateToNote( path: string, app: App ) {
  const note = app.vault.getAbstractFileByPath( path )
  if ( note !== null && note instanceof TFile ) {
    app.workspace.getLeaf( 'tab' ).openFile( note )
  }
}

const NoteCard: FC<NoteCardProps> = ( props ) => {
  const app = useContext( ObsidianContext )
  const [body, setBody] = useState( '' )
  const contentRef = useRef<HTMLDivElement>( null )
  const [expanded, setExpanded] = useState( false )
  const [overflowing, setOverflowing] = useState( false )

  useEffect(() => {
    const container = contentRef.current
    const renderNote = async () => {
      if ( container !== null ) {
        console.log( 'Rendering note' )
        await MarkdownRenderer.render( app, body, container, props.path, null )

        checkOverflow( container )
      } else {
        throw new Error( 'Owned container not found' )
      }
    }
    renderNote()

    return () => {
      setBody( '' )
    }
  }, [body] )

  useEffect(() => {
    const getContents = async () => {
      if ( file instanceof TFile ) {
        setBody( '' )
        const fileContents = await app.vault.cachedRead( file )
        setBody( fileContents )
      } else {
        setBody( 'Error' )
      }
    }
    getContents()

    return () => {
      setBody( '' )
    }
  }, [] )

  // Monitor modifications on that file.
  useEffect(() => {
    const callbackRef = app.vault.on( 'modify', async ( file ) => {
      console.log( 'calling modify callback function', { body })
      if ( file.path === props.path ) {
        if ( file instanceof TFile ) {
          setBody( '' )
          const fileContents = await app.vault.cachedRead( file )
          console.log({ fileContents, contentRef, children: contentRef.current.children })
          // some way to clear out the old children of the ref?
          // contentRef.current.children.item()
          setBody( fileContents )
        }
      }
    })

    return () => {
      app.vault.offref( callbackRef )
    }
  })

  const checkOverflow = ( container: HTMLDivElement ) => {
    if ( container.scrollHeight > container.clientHeight ) {
      setOverflowing( true )
    } else {
      setOverflowing( false )
    }
  }

  function onClick() {
    setExpanded( !expanded )
  }

  const file = app.vault.getAbstractFileByPath( props.path )
  const backlinkString = props.backlinks === 1 ? 'backlink' : 'backlinks'
  const overflowingClass = overflowing && !expanded ? 'overflowing' : ''
  const expandedClass = expanded ? 'expanded' : ''
  const contentStyle = expanded && contentRef.current ? { maxHeight: contentRef.current.scrollHeight } : {}

  return (
    <div className='desk__note-card' onClick={() => {
      onClick()
    }}>
      <div className='desk__note-card-header'>
        <a onClick={() => {
          return navigateToNote( props.path, app )
        }}>
          <h3 style={{ textDecoration: 'none' }}>{ _.capitalize( props.title ) }</h3>
          <hr style={{ marginTop: '1rem', marginBottom: '1rem' }}/>
        </a>
      </div>
      {/* note content here */}
      <div
        className={`desk__search-result-content ${overflowingClass} ${expandedClass}`}
        ref={contentRef}
        style={contentStyle}
      />
      <div className='desk__note-card-footer'>
        {props.folder &&
          <span>
            <Folder className="desk__note-card-header-details-icon" />
            <a
              onClick={() => {
                props.setFilters( [{ type: 'folder', reversed: false, value: props.folder }] )
              }}
            >
              {props.folder}
            </a>
          </span>
        }
        <span>
          <FileInput className="desk__note-card-header-details-icon" />
          <a onClick={() => {
            props.setFilters( [{ type: 'link', reversed: false, value: props.path, exists: true }] )
          }}
          >
            {`${props.backlinks} ${backlinkString}`}
          </a>
        </span>
        <span>
          <Clock className="desk__note-card-header-details-icon" />
          Modified on {props.date.toLocaleString( DateTime.DATE_SHORT )}
        </span>
      </div>
    </div>
  )
}

export default NoteCard
