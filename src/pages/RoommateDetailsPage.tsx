import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Spinner } from 'react-bootstrap'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useNavigate, useParams } from 'react-router-dom'
import RatingBreakdownItem from '../components/RatingBreakdownItem'
import UserPanelCard from '../components/UserPanelCard'
import { auth, db } from '../firebase'
import './RoommateDetailsPage.css'

type RatingsMap = Record<string, number>

interface RoommateDetails {
  name: string
  location: string
  description: string
  averageRating: number | null
  ratings: RatingsMap
}

const ratingLabels: Record<string, string> = {
  social: 'Social',
  cleanliness: 'Clean',
  communication: 'Communication',
  respect: 'Respectful',
  reliability: 'Reliable',
  quietness: 'Quiet',
  responsibility: 'Responsible',
  friendliness: 'Friendly',
}

const ratingOrder = [
  'social',
  'cleanliness',
  'communication',
  'respect',
  'reliability',
  'quietness',
  'responsibility',
  'friendliness',
]

export default function RoommateDetailsPage() {
  const navigate = useNavigate()
  const { source, entryId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [details, setDetails] = useState<RoommateDetails | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(Boolean(user))
      setCurrentUserId(user?.uid ?? '')
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    async function loadDetails() {
      if (!source || !entryId) {
        setError('Could not find this roommate entry.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        if (source === 'roommate') {
          const roommateSnapshot = await getDoc(doc(db, 'roommates', entryId))

          if (!roommateSnapshot.exists()) {
            setError('This roommate review no longer exists.')
            setLoading(false)
            return
          }

          const data = roommateSnapshot.data()
          const ratings = (data.ratings as RatingsMap | undefined) ?? {}
          const ratingValues = Object.values(ratings).filter((value) => typeof value === 'number')
          const averageRating = typeof data.averageRating === 'number'
            ? data.averageRating
            : ratingValues.length
              ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
              : null

          setDetails({
            name: (data.name as string | undefined) ?? 'Unnamed roommate',
            location: (data.location as string | undefined) ?? 'Location not provided',
            description: (data.description as string | undefined) ?? '',
            averageRating,
            ratings,
          })
        } else if (source === 'user') {
          const userSnapshot = await getDoc(doc(db, 'users', entryId))

          if (!userSnapshot.exists()) {
            setError('This user entry no longer exists.')
            setLoading(false)
            return
          }

          const data = userSnapshot.data()

          setDetails({
            name: (data.name as string | undefined) ?? 'Unnamed roommate',
            location: (data.location as string | undefined) ?? 'Location not provided',
            description: (data.bio as string | undefined) ?? '',
            averageRating: typeof data.rating === 'number' ? data.rating : null,
            ratings: {},
          })
        } else {
          setError('Unsupported roommate entry type.')
        }
      } catch {
        setError('Could not load this roommate right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadDetails()
  }, [entryId, source])

  const orderedRatings = useMemo(() => {
    if (!details) return []

    return ratingOrder
      .filter((key) => typeof details.ratings[key] === 'number')
      .map((key) => ({
        key,
        label: ratingLabels[key] ?? key,
        value: details.ratings[key],
      }))
  }, [details])

  function handleRateRoommate() {
    if (!details) return

    const isSelfUserEntry = source === 'user' && entryId && currentUserId && entryId === currentUserId

    if (isSelfUserEntry) {
      return
    }

    const query = new URLSearchParams({
      name: details.name,
      location: details.location,
      lockIdentity: '1',
    })

    if (source === 'roommate' && entryId) {
      query.set('roommateId', entryId)
    }

    if (source === 'user' && entryId) {
      query.set('subjectUserId', entryId)
    }

    if (!isSignedIn) {
      navigate('/login')
      return
    }

    navigate(`/roommates/new?${query.toString()}`)
  }

  if (loading) {
    return (
      <div className="roommate-details-page">
        <UserPanelCard className="roommate-details-card" bodyClassName="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3 mb-0 text-muted">Loading roommate details...</p>
        </UserPanelCard>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="roommate-details-page">
        <UserPanelCard className="roommate-details-card">
          <Alert variant="danger" className="mb-0">{error || 'Roommate details are unavailable.'}</Alert>
        </UserPanelCard>
      </div>
    )
  }

  const isSelfUserEntry = source === 'user' && entryId && currentUserId && entryId === currentUserId

  return (
    <div className="roommate-details-page">
      <UserPanelCard className="roommate-details-card">
        <div className="roommate-details-header">
          <div>
            <h1>{details.name}</h1>
            <p>{details.location}</p>
          </div>
          <Button type="button" variant="dark" onClick={handleRateRoommate} disabled={Boolean(isSelfUserEntry)}>
            {isSelfUserEntry ? 'You Cannot Rate Yourself' : isSignedIn ? 'Rate This Roommate' : 'Sign In To Rate'}
          </Button>
        </div>

        <section className="roommate-ratings-section">
          <div className="roommate-overall-rating">
            <span className="roommate-overall-number">
              {details.averageRating !== null ? details.averageRating.toFixed(1) : 'N/A'}
            </span>
            <span className="roommate-overall-label">Overall Rating</span>
          </div>

          <div className="roommate-rating-grid">
            {orderedRatings.length > 0 ? (
              orderedRatings.map((item) => (
                <RatingBreakdownItem
                  key={item.key}
                  label={item.label}
                  value={item.value}
                />
              ))
            ) : (
              <p className="roommate-no-ratings mb-0">No detailed category ratings yet. Be the first to add one.</p>
            )}
          </div>
        </section>

        <section className="roommate-description-section">
          <h2>About This Roommate</h2>
          <p>{details.description || 'No written description has been submitted yet.'}</p>
        </section>
      </UserPanelCard>
    </div>
  )
}