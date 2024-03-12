import { FC } from 'react'
import { Folder as FolderIcon } from 'lucide-react'

import { FolderProps } from '../../types'

const Folder: FC<FolderProps> = ({ folder, folderOnClick }) => {
  if ( !folder ) {
    return null
  }

  return (
    <div>
      <FolderIcon className="desk__note-card-header-details-icon" />
      <a
        onClick={() => {
          return folderOnClick( 'folder' )
        }}
      >
        {folder}
      </a>
    </div>
  )
}

export default Folder
