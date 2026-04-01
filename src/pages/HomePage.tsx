import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { collection, getDocs } from 'firebase/firestore'
import SearchInput from '../components/SearchInput'
import { db } from '../firebase'
import './HomePage.css'

interface Roommate {
  id: string
  name?: string
  location?: string
  rating?: number
  bio?: string
}

export default function HomePage() {
  const [location, setLocation] = useState('')
  const [name, setName] = useState('')
  const [roommates, setRoommates] = useState<Roommate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const locationTerm = location.trim().toLowerCase()
    const nameTerm = name.trim().toLowerCase()

    if (!locationTerm && !nameTerm) {
      setError('Enter a location or a name to search.')
      setRoommates([])
      return
    }

    try {
      setLoading(true)
      setError('')

      const snapshot = await getDocs(collection(db, 'users'))
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Roommate[]

      const filtered = docs.filter((roommate) => {
        const roommateLocation = (roommate.location ?? '').toLowerCase()
        const roommateName = (roommate.name ?? '').toLowerCase()

        const matchesLocation = !locationTerm || roommateLocation.includes(locationTerm)
        const matchesName = !nameTerm || roommateName.includes(nameTerm)

        return matchesLocation && matchesName
      })

      setRoommates(filtered)
    } catch {
      setError('Could not load roommate results from Firebase right now.')
      setRoommates([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">Rate my Roommates</h1>
        <Form className="search-area-form" onSubmit={handleSearch}>
          <SearchInput
            id="locationSearch"
            placeholder="Type your street address, city, state, or 5-digit ZIP code..."
            value={location}
            onChange={setLocation}
          />
          <p className="search-divider">or</p>
          <SearchInput
            id="nameSearch"
            placeholder="Search by name..."
            value={name}
            onChange={setName}
          />

          <div className="search-actions">
            <Button type="submit" variant="dark" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </Form>

        {error ? (
          <Alert variant="danger" className="search-feedback">{error}</Alert>
        ) : null}

        {!loading && !error && roommates.length > 0 ? (
          <div className="search-results">
            {roommates.map((roommate) => (
              <article key={roommate.id} className="result-card">
                <h3>{roommate.name ?? 'Unnamed roommate'}</h3>
                <p><strong>Location:</strong> {roommate.location ?? 'Not provided'}</p>
                <p><strong>Rating:</strong> {roommate.rating ?? 'N/A'}</p>
                {roommate.bio ? <p>{roommate.bio}</p> : null}
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !error && roommates.length === 0 && (location || name) ? (
          <p className="search-feedback text-muted">No matching roommates found.</p>
        ) : null}
      </div>
    </div>
  )
}
