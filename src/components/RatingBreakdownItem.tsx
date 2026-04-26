import './RatingBreakdownItem.css'

interface RatingBreakdownItemProps {
  label: string
  value: number
}

export default function RatingBreakdownItem({ label, value }: RatingBreakdownItemProps) {
  return (
    <article className="rating-breakdown-item">
      <p>{label}</p>
      <div className="rating-breakdown-pill">{value.toFixed(1)}</div>
    </article>
  )
}