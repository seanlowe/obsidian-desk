import { FC } from 'react'
import { Clock } from 'lucide-react'
import { DateTime } from 'luxon'

import { ModifiedAtProps } from '../../types'

const ModifiedAt: FC<ModifiedAtProps> = ({ date }) => {
  const formattedDate = date.toLocaleString( DateTime.DATE_SHORT )

  return (
    <div>
      <Clock className="desk__note-card-header-details-icon" />
      Modified on {formattedDate}
    </div>
  )
}

export default ModifiedAt
