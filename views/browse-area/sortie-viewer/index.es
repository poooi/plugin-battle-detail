import _ from 'lodash'
import React, { PureComponent } from 'react'

import AppData from 'lib/appdata'

(async () => {
  const indexData = await AppData.loadIndex()
  const recordIndices = _.fromPairs(
    indexData.map((x, lineInd) => [x.id, {...x, lineInd}]))
  console.log(recordIndices)
})()

class SortieViewer extends PureComponent {
  render() {
    return (
      <div>SortieViewer</div>
    )
  }
}

export { SortieViewer }
