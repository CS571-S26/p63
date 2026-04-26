import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import SearchInput from '../components/SearchInput'
import { auth, db } from '../firebase'
import './HomePage.css'

interface Roommate {
  id: string
  entryId: string
  source: 'user' | 'roommate'
  name?: string
  location?: string
  rating?: number
  bio?: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const [searchParams] = useSearchParams()
  const feedback = (routeLocation.state as { feedback?: string } | null)?.feedback ?? ''
  const contentRef = useRef<HTMLDivElement>(null)
  const searchRequestId = useRef(0)
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [name, setName] = useState(searchParams.get('name') ?? '')
  const [roommates, setRoommates] = useState<Roommate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [contentTopOffset, setContentTopOffset] = useState(0)

  const hasSearchTerms = Boolean(location.trim() || name.trim())
  const canAddRoommate = Boolean(location.trim() && name.trim())

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(Boolean(user))
    })

    return () => unsubscribe()
  }, [])

  function handleAddRoommate() {
    if (!isSignedIn) {
      navigate('/login')
      return
    }

    const searchParams = new URLSearchParams({
      name: name.trim(),
      location: location.trim(),
    })

    navigate(`/roommates/new?${searchParams.toString()}`)
  }

  function handleOpenDetails(roommate: Roommate) {
    navigate(`/roommates/${roommate.source}/${roommate.entryId}`)
  }

  async function runSearch() {
    const locationTerm = location.trim().toLowerCase()
    const nameTerm = name.trim().toLowerCase()

    if (!locationTerm && !nameTerm) {
      setError('')
      setRoommates([])
      setHasSearched(false)
      setLoading(false)
      return
    }

    const requestId = ++searchRequestId.current

    try {
      setLoading(true)
      setError('')

      const [usersResult, roommatesResult] = await Promise.allSettled([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'roommates')),
      ])

      if (usersResult.status !== 'fulfilled') {
        throw usersResult.reason
      }

      const users = usersResult.value.docs.map((doc) => ({
        id: `user-${doc.id}`,
        entryId: doc.id,
        source: 'user' as const,
        ...doc.data(),
      })) as Roommate[]

      const roommateEntries = roommatesResult.status === 'fulfilled'
        ? roommatesResult.value.docs.map((doc) => {
            const data = doc.data()

            return {
              id: `roommate-${doc.id}`,
              entryId: doc.id,
              source: 'roommate' as const,
              name: data.name as string | undefined,
              location: data.location as string | undefined,
              rating: typeof data.averageRating === 'number' ? data.averageRating : undefined,
              bio: data.description as string | undefined,
            }
          })
        : []

      if (requestId !== searchRequestId.current) {
        return
      }

      const docs = [...users, ...roommateEntries]

      const filtered = docs.filter((roommate) => {
        const roommateLocation = (roommate.location ?? '').toLowerCase()
        const roommateName = (roommate.name ?? '').toLowerCase()

        const matchesLocation = !locationTerm || roommateLocation.includes(locationTerm)
        const matchesName = !nameTerm || roommateName.includes(nameTerm)

        return matchesLocation && matchesName
      })

      setRoommates(filtered)
      setHasSearched(true)
    } catch {
      if (requestId !== searchRequestId.current) {
        return
      }

      setError('Could not load roommate results from Firebase right now.')
      setRoommates([])
      setHasSearched(false)
    } finally {
      if (requestId === searchRequestId.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const locationTerm = location.trim()
    const nameTerm = name.trim()

    if (!locationTerm && !nameTerm) {
      setRoommates([])
      setError('')
      setHasSearched(false)
      setLoading(false)
      searchRequestId.current += 1
      return
    }

    setHasSearched(false)

    const timeoutId = window.setTimeout(() => {
      void runSearch()
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [location, name])

  useEffect(() => {
    function updateContentOffset() {
      if (!contentRef.current) return

      const mobile = window.innerWidth <= 640
      const navHeight = mobile ? 56 : 64
      const minimumTopOffset = mobile ? 24 : 40
      const upwardBias = mobile ? 20 : 56
      const availableHeight = window.innerHeight - navHeight
      const contentHeight = contentRef.current.offsetHeight
      const centeredOffset = (availableHeight - contentHeight) / 2 - upwardBias

      setContentTopOffset(Math.max(minimumTopOffset, Math.round(centeredOffset)))
    }

    updateContentOffset()

    const observer = new ResizeObserver(() => updateContentOffset())

    if (contentRef.current) {
      observer.observe(contentRef.current)
    }

    window.addEventListener('resize', updateContentOffset)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateContentOffset)
    }
  }, [feedback, hasSearched, loading, error, roommates.length, location, name])

  return (
    <div className="home-page" style={{ paddingTop: `${contentTopOffset}px` }}>
      <div className="home-content" ref={contentRef}>
        <h1 className="home-title">Rate my Roommates</h1>

        {feedback ? (
          <Alert
            variant="success"
            dismissible
            onClose={() => navigate(routeLocation.pathname, { replace: true })}
            className="search-feedback"
          >
            {feedback}
          </Alert>
        ) : null}

        <Form className="search-area-form">
          <SearchInput
            id="locationSearch"
            placeholder="Type your street address, city, state, or 5-digit ZIP code..."
            ariaLabel="Search by location"
            value={location}
            onChange={setLocation}
          />
          <p className="search-divider">or</p>
          <SearchInput
            id="nameSearch"
            placeholder="Search by name..."
            ariaLabel="Search by name"
            value={name}
            onChange={setName}
          />
        </Form>

        {loading ? (
          <div className="search-loading-state">
            <Spinner as="span" animation="border" size="sm" className="me-2" />
            Searching...
          </div>
        ) : null}

        {error ? (
          <Alert variant="danger" className="search-feedback">{error}</Alert>
        ) : null}

        {!loading && !error && roommates.length > 0 ? (
          <div className="search-results">
            {roommates.map((roommate) => (
              <button
                key={roommate.id}
                type="button"
                className="result-card result-card-button"
                onClick={() => handleOpenDetails(roommate)}
              >
                <h3>{roommate.name ?? 'Unnamed roommate'}</h3>
                <p><strong>Location:</strong> {roommate.location ?? 'Not provided'}</p>
                <p><strong>Rating:</strong> {typeof roommate.rating === 'number' ? roommate.rating.toFixed(1) : 'N/A'}</p>
                <p><strong>Source:</strong> {roommate.source === 'user' ? 'User profile' : 'Roommate review'}</p>
                {roommate.bio ? <p>{roommate.bio}</p> : null}
              </button>
            ))}
          </div>
        ) : null}

        {!loading && !error && hasSearched && roommates.length === 0 && hasSearchTerms ? (
          <div className="search-empty-state">
            <p className="search-feedback text-muted mb-2">No matching roommates found.</p>
            {canAddRoommate ? (
              <Button type="button" variant="outline-dark" onClick={handleAddRoommate}>
                {isSignedIn ? 'Add this roommate' : 'Sign in to rate this roommate'}
              </Button>
            ) : (
              <p className="search-add-hint mb-0">To add a roommate, search with both their name and the location where you lived together.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
