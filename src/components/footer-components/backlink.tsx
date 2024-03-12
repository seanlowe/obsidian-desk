import React, { FC } from 'react'
import { FileInput } from 'lucide-react'

import { BacklinksProps } from '../../types'

const Backlinks: FC<BacklinksProps> = ({ backlinks, backlinkOnClick }) => {
  const backlinkString = backlinks === 1 ? 'backlink' : 'backlinks'

  return (
    <div>
      <FileInput className="desk__note-card-header-details-icon" />
      <a onClick={() => {
        return backlinkOnClick( 'link' ) 
      }}>
        {`${backlinks} ${backlinkString}`}
      </a>
    </div>
  )
}

export default Backlinks
