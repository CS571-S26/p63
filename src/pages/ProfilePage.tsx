import { useEffect, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import UserPanelCard from '../components/UserPanelCard'
import './ProfilePage.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [uid, setUid] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login')
        return
      }

      setUid(user.uid)
      setEmail(user.email ?? '')

      try {
        const profileRef = doc(db, 'users', user.uid)
        const profileSnapshot = await getDoc(profileRef)

        if (profileSnapshot.exists()) {
          const data = profileSnapshot.data()
          setFirstName((data.firstName as string) ?? '')
          setLastName((data.lastName as string) ?? '')
          setBirthday((data.birthday as string) ?? '')
          setLocation((data.location as string) ?? '')
          setBio((data.bio as string) ?? '')
        }
      } catch {
        setError('Could not load your profile right now.')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate])

  async function handleSaveProfile() {
    if (!uid) return

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email,
          name: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          birthday,
          location,
          bio,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setSuccess('Profile updated successfully.')
    } catch {
      setError('Could not save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
      navigate('/', { state: { feedback: 'You have been logged out.' } })
    } catch {
      setError('Could not sign out right now.')
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <UserPanelCard className="profile-card" bodyClassName="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-3 mb-0 text-muted">Loading profile...</p>
        </UserPanelCard>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <UserPanelCard className="profile-card">
          <div className="profile-header-row">
            <div>
              <h1 className="profile-title">My Profile</h1>
              <p className="profile-subtitle">View and update your information.</p>
            </div>
            <Button type="button" variant="outline-dark" onClick={handleSignOut}>Sign Out</Button>
          </div>

          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <Form>
            <Form.Group className="mb-3" controlId="profileEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} disabled />
              <Form.Text className="text-muted">Email and password edits will be added later.</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileFirstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileLastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileBirthday">
              <Form.Label>Birthday</Form.Label>
              <Form.Control type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileLocation">
              <Form.Label>Location</Form.Label>
              <Form.Control type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
            </Form.Group>

            <Form.Group className="mb-0" controlId="profileBio">
              <Form.Label>Bio</Form.Label>
              <Form.Control as="textarea" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Form.Group>

            <div className="profile-actions">
              <Button type="button" variant="dark" onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Form>
      </UserPanelCard>
    </div>
  )
}
