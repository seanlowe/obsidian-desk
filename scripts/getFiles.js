// thanks to: https://www.codefeetime.com/post/rollup-config-for-react-component-library-with-typescript-scss/

import * as fs from 'fs'

export const getFiles = ( entry, extensions = [], excludeExtensions = [] ) => {
  let fileNames = []
  const dirs = fs.readdirSync( entry )

  dirs.forEach(( dir ) => {
    const path = `${entry}/${dir}`

    if ( fs.lstatSync( path ).isDirectory()) {
      fileNames = [
        ...fileNames,
        ...getFiles( path, extensions, excludeExtensions ),
      ]

      return
    }

    if ( !excludeExtensions.some(( exclude ) => {
      return dir.endsWith( exclude ) 
    })
      && extensions.some(( ext ) => {
        return dir.endsWith( ext ) 
      })
    ) {
      fileNames.push( path )
    }
  })

  return fileNames
}
