import { useMemo, useState } from 'react'
import { Button, Card, Form, Alert, Spinner } from 'react-bootstrap'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import './SignUpPage.css'

const steps = ['Account', 'Profile', 'Bio', 'Review']

export default function SignUpPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stepTitle = useMemo(() => {
    if (currentStep === 0) return 'Create your account'
    if (currentStep === 1) return 'Tell us about yourself'
    if (currentStep === 2) return 'Add your bio'
    return 'Review and confirm'
  }, [currentStep])

  const stepSubtitle = useMemo(() => {
    if (currentStep === 0) return 'Step 1 of 4: email and password'
    if (currentStep === 1) return 'Step 2 of 4: profile details'
    if (currentStep === 2) return 'Step 3 of 4: short roommate bio'
    return 'Step 4 of 4: confirm everything looks right'
  }, [currentStep])

  function handleNext() {
    setError(null)
    if (currentStep === 0) {
      if (!email || !password || !passwordConfirmation) {
        setError('Please fill in all fields.')
        return
      }
      if (password !== passwordConfirmation) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  function handleBack() {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleCreateAccount() {
    setError(null)
    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        birthday,
        bio,
        location,
        rating: 0,
        createdAt: serverTimestamp(),
      })
      navigate('/', { state: { feedback: 'Account created and you are now logged in.' } })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      const friendlyErrors: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'permission-denied': 'Account created but profile could not be saved. Check your Firestore security rules.',
      }
      setError(friendlyErrors[code] ?? `Something went wrong (${code || 'unknown'}). Please try again.`)
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <Card className="signup-card">
        <Card.Body>
          <h1 className="signup-title">Sign Up</h1>
          <p className="signup-subtitle">Join Rate My Roommates in a few quick steps.</p>

          <div className="signup-stepper" aria-label="Sign up steps">
            {steps.map((label, index) => {
              const stateClass = index < currentStep ? 'is-done' : index === currentStep ? 'is-active' : 'is-upcoming'

              return (
                <div key={label} className={`signup-step ${stateClass}`}>
                  <span className="signup-step-index">{index + 1}</span>
                  <span className="signup-step-label">{label}</span>
                </div>
              )
            })}
          </div>

          <div className="signup-panel">
            <h2 className="signup-panel-title">{stepTitle}</h2>
            <p className="signup-panel-subtitle">{stepSubtitle}</p>

            {currentStep === 0 ? (
              <>
                <Form.Group className="mb-3" controlId="signupEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="signupPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-0" controlId="signupPasswordConfirm">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm your password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                </Form.Group>
              </>
            ) : null}

            {currentStep === 1 ? (
              <>
                <Form.Group className="mb-3" controlId="signupFirstName">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control type="text" placeholder="Enter your first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="signupLastName">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control type="text" placeholder="Enter your last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="signupBirthday">
                  <Form.Label>Birthday</Form.Label>
                  <Form.Control type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-0" controlId="signupLocation">
                  <Form.Label>Location</Form.Label>
                  <Form.Control type="text" placeholder="City, State (e.g. Madison, WI)" value={location} onChange={(e) => setLocation(e.target.value)} />
                </Form.Group>
              </>
            ) : null}

            {currentStep === 2 ? (
              <Form.Group className="mb-0" controlId="signupBio">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Share your lifestyle, cleanliness habits, and what you're looking for in a roommate."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Form.Group>
            ) : null}

            {currentStep === 3 ? (
              <div className="signup-review">
                <p><strong>Email:</strong> {email || 'Not entered yet'}</p>
                <p><strong>Password:</strong> {password ? '********' : 'Not entered yet'}</p>
                <p><strong>First Name:</strong> {firstName || 'Not entered yet'}</p>
                <p><strong>Last Name:</strong> {lastName || 'Not entered yet'}</p>
                <p><strong>Birthday:</strong> {birthday || 'Not entered yet'}</p>
                <p><strong>Location:</strong> {location || 'Not entered yet'}</p>
                <p><strong>Bio:</strong> {bio || 'Not entered yet'}</p>
              </div>
            ) : null}
          </div>

          {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}

          <div className="signup-actions">
            <Button type="button" variant="outline-secondary" onClick={handleBack} disabled={currentStep === 0 || isLoading}>Back</Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" variant="dark" onClick={handleNext} disabled={isLoading}>Next Step</Button>
            ) : (
              <Button type="button" variant="success" onClick={handleCreateAccount} disabled={isLoading}>
                {isLoading ? <><Spinner animation="border" size="sm" className="me-2" />Creating...</> : 'Create Account'}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
