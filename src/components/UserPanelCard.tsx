import { Card } from 'react-bootstrap'
import type { ReactNode } from 'react'
import './UserPanelCard.css'

interface UserPanelCardProps {
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export default function UserPanelCard({ children, className = '', bodyClassName = '' }: UserPanelCardProps) {
  const cardClassName = `user-panel-card ${className}`.trim()

  return (
    <Card className={cardClassName}>
      <Card.Body className={bodyClassName}>{children}</Card.Body>
    </Card>
  )
}
