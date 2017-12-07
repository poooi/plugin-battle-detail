import _ from 'lodash'
import { createSelector } from 'reselect'

import { indexesSelector } from '../../selectors'

const indexesGrouppedByMapSelector = createSelector(
  indexesSelector,
  xs => _.groupBy(xs, x => x.map || 'pvp')
)

import { selectorTester } from 'subtender/poi'

selectorTester(indexesGrouppedByMapSelector)
