import React from 'react'
import { Pagination } from 'react-bootstrap'

import { createUltimatePagination, ITEM_TYPES } from 'react-ultimate-pagination'

/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
const UPagination = props => {
  const {style, ...propsRemaining} = props
  return createUltimatePagination({
    WrapperComponent: wProps => <Pagination style={style} {...wProps} />,
    itemTypeToComponent: {
      [ITEM_TYPES.PAGE]: ({value, isActive, onClick}) => (
        <Pagination.Item onClick={onClick} active={isActive}>{value}</Pagination.Item>
      ),
      [ITEM_TYPES.ELLIPSIS]: ({isActive, onClick}) => (
        <Pagination.Ellipsis disabled={isActive} onClick={onClick} />
      ),
      [ITEM_TYPES.FIRST_PAGE_LINK]: ({isActive, onClick}) => (
        <Pagination.First disabled={isActive} onClick={onClick} />
      ),
      [ITEM_TYPES.PREVIOUS_PAGE_LINK]: ({isActive, onClick}) => (
        <Pagination.Prev disabled={isActive} onClick={onClick} />
      ),
      [ITEM_TYPES.NEXT_PAGE_LINK]: ({isActive, onClick}) => (
        <Pagination.Next disabled={isActive} onClick={onClick} />
      ),
      [ITEM_TYPES.LAST_PAGE_LINK]: ({isActive, onClick}) => (
        <Pagination.Last disabled={isActive} onClick={onClick} />
      ),
    },
  })(propsRemaining)
}

export { UPagination }
