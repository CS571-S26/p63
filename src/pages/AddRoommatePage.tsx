import { useMemo, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RatingCategoryCard from '../components/RatingCategoryCard'
import UserPanelCard from '../components/UserPanelCard'
import { auth, db } from '../firebase'
import './AddRoommatePage.css'

const ratingCategories = [
  { key: 'social', label: 'Social', leftLabel: '1 - Reserved', rightLabel: '5 - Social butterfly' },
  { key: 'cleanliness', label: 'Clean', leftLabel: '1 - Messy', rightLabel: '5 - Spotless' },
  { key: 'communication', label: 'Communication', leftLabel: '1 - Hard to reach', rightLabel: '5 - Very clear' },
  { key: 'respect', label: 'Respectful', leftLabel: '1 - Inconsiderate', rightLabel: '5 - Very respectful' },
  { key: 'reliability', label: 'Reliable', leftLabel: '1 - Unreliable', rightLabel: '5 - Dependable' },
  { key: 'quietness', label: 'Quiet', leftLabel: '1 - Loud', rightLabel: '5 - Peaceful' },
  { key: 'responsibility', label: 'Responsible', leftLabel: '1 - Careless', rightLabel: '5 - Accountable' },
  { key: 'friendliness', label: 'Friendly', leftLabel: '1 - Cold', rightLabel: '5 - Awesome' },
] as const

type RatingKey = (typeof ratingCategories)[number]['key']
type RatingsState = Record<RatingKey, number>

const initialRatings = ratingCategories.reduce((accumulator, category) => {
  accumulator[category.key] = 3
  return accumulator
}, {} as RatingsState)

export default function AddRoommatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [name, setName] = useState(searchParams.get('name') ?? '')
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [description, setDescription] = useState('')
  const [ratings, setRatings] = useState<RatingsState>(initialRatings)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const averageRating = useMemo(() => {
    const values = Object.values(ratings)
    const total = values.reduce((sum, value) => sum + value, 0)
    return values.length ? total / values.length : 0
  }, [ratings])

  function handleRatingChange(category: RatingKey, value: number) {
    setRatings((current) => ({
      ...current,
      [category]: value,
    }))
  }

  async function handleSaveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedLocation = location.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName || !trimmedLocation) {
      setError('Enter the roommate name and the location where you lived together.')
      return
    }

    if (!trimmedDescription) {
      setError('Add a description to explain your ratings.')
      return
    }

    setSaving(true)

    try {
      await addDoc(collection(db, 'roommates'), {
        name: trimmedName,
        location: trimmedLocation,
        description: trimmedDescription,
        ratings,
        averageRating: Number(averageRating.toFixed(1)),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid ?? null,
      })

      navigate('/', { state: { feedback: `Saved a review for ${trimmedName}.` } })
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? ''

      if (code === 'permission-denied') {
        setError('Could not save this review because Firestore rules do not allow access to the roommates collection yet.')
      } else {
        setError('Could not save this roommate review right now. Please try again.')
      }

      setSaving(false)
    }
  }

  return (
    <div className="add-roommate-page">
      <UserPanelCard className="add-roommate-card">
        <div className="add-roommate-header">
          <div>
            <h1 className="add-roommate-title">Add A Roommate</h1>
            <p className="add-roommate-subtitle">Rate someone you lived with so they can be found in future searches.</p>
          </div>
          <div className="add-roommate-average-pill">
            Avg. {averageRating.toFixed(1)} / 5.0
          </div>
        </div>

        <Form onSubmit={handleSaveReview}>
          <div className="add-roommate-fields">
            <Form.Group controlId="roommateName">
              <Form.Label>Roommate Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter their full name"
              />
            </Form.Group>

            <Form.Group controlId="roommateLocation">
              <Form.Label>Where You Lived Together</Form.Label>
              <Form.Control
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, State or address"
              />
            </Form.Group>
          </div>

          <div className="rating-category-list">
            {ratingCategories.map((category) => (
              <RatingCategoryCard
                key={category.key}
                label={category.label}
                value={ratings[category.key]}
                onChange={(value) => handleRatingChange(category.key, value)}
                leftLabel={category.leftLabel}
                rightLabel={category.rightLabel}
              />
            ))}
          </div>

          <Form.Group controlId="roommateDescription" className="add-roommate-description-group">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write about what they were like to live with."
            />
          </Form.Group>

          {error ? <Alert variant="danger" className="mt-3 mb-0">{error}</Alert> : null}

          <div className="add-roommate-actions">
            <Button type="button" variant="outline-secondary" onClick={() => navigate(-1)} disabled={saving}>Back</Button>
            <Button type="submit" variant="dark" disabled={saving}>
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Review'
              )}
            </Button>
          </div>
        </Form>
      </UserPanelCard>
    </div>
  )
}