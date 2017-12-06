import { PropTypes } from 'prop-types'

// PTyp is just short for PropTypes.
// In addition, this allows us to collect validation logic
// in one place

const allRequired = shapeObj => {
  const ret = {}
  Object.keys(shapeObj).map(k => {
    const original = shapeObj[k]
    ret[k] = typeof original.isRequired !== 'undefined' ?
      original.isRequired :
      PropTypes.oneOfType([original]).isRequired
  })
  return ret
}

const PTyp = {
  ...PropTypes,
  allRequired,
}

export { PTyp }
