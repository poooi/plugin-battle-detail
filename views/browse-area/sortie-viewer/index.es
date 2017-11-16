import _ from 'lodash'
import React, { PureComponent } from 'react'

import AppData from 'lib/appdata'

/*
  TODO: keep index as an Array, this is to make it flexible
  so that both grouping by map or grouping as a whole are possible.
  might need to be smart on caching mechanism so it doesn't have to reload everything.
(async () => {
  const indexData = await AppData.loadIndex()
  const recordIndices = _.groupBy(
    _.fromPairs(
      indexData.map((x, lineInd) => [x.id, {...x, lineInd}])
    ),
    'map'
  )
  console.log(recordIndices)
})()
*/

class SortieViewer extends PureComponent {
  render() {
    return (
      <div>SortieViewer</div>
    )
  }
}

export { SortieViewer }
