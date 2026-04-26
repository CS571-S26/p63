import { Form } from 'react-bootstrap'
import './RatingCategoryCard.css'

interface RatingCategoryCardProps {
  label: string
  value: number
  onChange: (value: number) => void
  leftLabel: string
  rightLabel: string
}

export default function RatingCategoryCard({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: RatingCategoryCardProps) {
  return (
    <article className="rating-category-card">
      <div className="rating-category-header">
        <p className="rating-category-title">{label}</p>
        <span className="rating-category-value">{value.toFixed(1)}</span>
      </div>

      <div className="rating-category-slider-wrap">
        <Form.Range
          min={1}
          max={5}
          step={0.1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="rating-category-slider"
          aria-label={`${label} rating`}
        />
      </div>

      <div className="rating-category-labels" aria-hidden="true">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </article>
  )
}