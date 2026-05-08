import React from 'react'
import { Button, ButtonGroup } from '@blueprintjs/core'

interface UPaginationProps {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
  style?: React.CSSProperties
}

export const UPagination: React.FC<UPaginationProps> = ({ currentPage, totalPages, onChange, style }) => {
  if (totalPages <= 1) return null

  const pages: React.ReactNode[] = []

  const addPage = (page: number, label?: string) => {
    pages.push(
      <Button
        key={page}
        active={page === currentPage}
        onClick={() => onChange(page)}
        small
      >
        {label ?? page}
      </Button>
    )
  }

  const addEllipsis = (key: string) => {
    pages.push(
      <Button key={key} disabled small>…</Button>
    )
  }

  addPage(1)
  if (currentPage > 4) addEllipsis('left')
  for (let p = Math.max(2, currentPage - 2); p <= Math.min(totalPages - 1, currentPage + 2); p++) {
    addPage(p)
  }
  if (currentPage < totalPages - 3) addEllipsis('right')
  if (totalPages > 1) addPage(totalPages)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, ...style }}>
      <Button
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
        small
        icon="chevron-left"
      />
      <ButtonGroup minimal>{pages}</ButtonGroup>
      <Button
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
        small
        icon="chevron-right"
      />
    </div>
  )
}
