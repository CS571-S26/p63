import { useMemo, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, where, writeBatch } from 'firebase/firestore'
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
  const targetRoommateId = searchParams.get('roommateId') ?? ''
  const subjectUserId = searchParams.get('subjectUserId') ?? ''
  const lockIdentity = searchParams.get('lockIdentity') === '1'
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

    const currentUserId = auth.currentUser?.uid ?? ''

    if (!currentUserId) {
      setError('You must be signed in to submit a rating.')
      return
    }

    if (subjectUserId && subjectUserId === currentUserId) {
      setError('You cannot rate yourself.')
      return
    }

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
      // Resolve reviewer display name upfront
      let reviewerName = 'Anonymous Reviewer'
      try {
        const userSnap = await getDoc(doc(db, 'users', currentUserId))
        if (userSnap.exists()) {
          const ud = userSnap.data()
          const fn = typeof ud.firstName === 'string' ? ud.firstName : ''
          const ln = typeof ud.lastName === 'string' ? ud.lastName : ''
          reviewerName = [fn, ln].filter(Boolean).join(' ') || auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous Reviewer'
        } else {
          reviewerName = auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous Reviewer'
        }
      } catch {
        reviewerName = auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous Reviewer'
      }

      let effectiveTargetRoommateId = targetRoommateId

      if (!effectiveTargetRoommateId) {
        if (subjectUserId) {
          const subjectMatch = await getDocs(
            query(collection(db, 'roommates'), where('subjectUserId', '==', subjectUserId), limit(1)),
          )

          if (!subjectMatch.empty) {
            effectiveTargetRoommateId = subjectMatch.docs[0].id
          }
        } else {
          const normalizedSubjectKey = `${trimmedName.toLowerCase()}|${trimmedLocation.toLowerCase()}`
          const keyMatch = await getDocs(
            query(collection(db, 'roommates'), where('subjectKey', '==', normalizedSubjectKey), limit(1)),
          )

          if (!keyMatch.empty) {
            effectiveTargetRoommateId = keyMatch.docs[0].id
          }
        }
      }

      if (effectiveTargetRoommateId) {
        await runTransaction(db, async (transaction) => {
          const roommateRef = doc(db, 'roommates', effectiveTargetRoommateId)
          const roommateSnapshot = await transaction.get(roommateRef)

          if (!roommateSnapshot.exists()) {
            throw new Error('target-roommate-missing')
          }

          const existingData = roommateSnapshot.data()
          const existingSubjectUserId = typeof existingData.subjectUserId === 'string' ? existingData.subjectUserId : ''

          if (existingSubjectUserId && existingSubjectUserId === currentUserId) {
            throw new Error('cannot-rate-self')
          }

          const existingRatedBy = Array.isArray(existingData.ratedBy)
            ? existingData.ratedBy.filter((value): value is string => typeof value === 'string')
            : []

          if (existingRatedBy.includes(currentUserId)) {
            throw new Error('already-rated')
          }

          const existingRatings = (existingData.ratings as Partial<RatingsState> | undefined) ?? {}
          const existingTotals = (existingData.ratingTotals as Partial<RatingsState> | undefined) ?? {}
          const existingCount =
            typeof existingData.ratingCount === 'number' && existingData.ratingCount > 0
              ? existingData.ratingCount
              : 1

          const nextTotals = { ...initialRatings }

          for (const category of ratingCategories) {
            const key = category.key
            const existingAverage = typeof existingRatings[key] === 'number' ? existingRatings[key] : 3
            const fallbackTotal = existingAverage * existingCount
            const currentTotal = typeof existingTotals[key] === 'number' ? existingTotals[key] : fallbackTotal

            nextTotals[key] = Number((currentTotal + ratings[key]).toFixed(4))
          }

          const nextCount = existingCount + 1
          const nextRatings = { ...initialRatings }

          for (const category of ratingCategories) {
            const key = category.key
            nextRatings[key] = Number((nextTotals[key] / nextCount).toFixed(1))
          }

          const overall = Object.values(nextRatings).reduce((sum, value) => sum + value, 0) / ratingCategories.length

          transaction.update(roommateRef, {
            name: trimmedName,
            location: trimmedLocation,
            ratings: nextRatings,
            ratingTotals: nextTotals,
            ratingCount: nextCount,
            ratedBy: [...existingRatedBy, currentUserId],
            averageRating: Number(overall.toFixed(1)),
            description: trimmedDescription,
            updatedAt: serverTimestamp(),
            updatedBy: currentUserId,
          })

          const reviewRef = doc(db, 'roommates', effectiveTargetRoommateId, 'reviews', currentUserId)
          transaction.set(reviewRef, {
            ratings,
            description: trimmedDescription,
            reviewerName,
            createdAt: serverTimestamp(),
          })
        })
      } else {
        const normalizedSubjectKey = `${trimmedName.toLowerCase()}|${trimmedLocation.toLowerCase()}`
        const newRoommateRef = doc(collection(db, 'roommates'))
        const reviewRef = doc(db, 'roommates', newRoommateRef.id, 'reviews', currentUserId)

        const batch = writeBatch(db)

        batch.set(newRoommateRef, {
          name: trimmedName,
          location: trimmedLocation,
          subjectUserId: subjectUserId || null,
          subjectKey: normalizedSubjectKey,
          description: trimmedDescription,
          ratings,
          ratingTotals: ratings,
          ratingCount: 1,
          ratedBy: [currentUserId],
          averageRating: Number(averageRating.toFixed(1)),
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
        })

        batch.set(reviewRef, {
          ratings,
          description: trimmedDescription,
          reviewerName,
          createdAt: serverTimestamp(),
        })

        await batch.commit()
      }

      navigate('/', { state: { feedback: `Saved a review for ${trimmedName}.` } })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'target-roommate-missing') {
        setError('That roommate review no longer exists. Please return to search and try again.')
        setSaving(false)
        return
      }

      if (error instanceof Error && error.message === 'already-rated') {
        setError('You have already rated this roommate.')
        setSaving(false)
        return
      }

      if (error instanceof Error && error.message === 'cannot-rate-self') {
        setError('You cannot rate yourself.')
        setSaving(false)
        return
      }

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
                disabled={lockIdentity}
              />
            </Form.Group>

            <Form.Group controlId="roommateLocation">
              <Form.Label>Where You Lived Together</Form.Label>
              <Form.Control
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, State or address"
                disabled={lockIdentity}
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