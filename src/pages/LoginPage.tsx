import { useState } from 'react'
import { Button, Card, Form, Alert, Spinner } from 'react-bootstrap'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/', { state: { feedback: 'You are now logged in.' } })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      const friendlyErrors: Record<string, string> = {
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
      }
      setError(friendlyErrors[code] ?? 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <Card.Body>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Log in to continue rating roommates.</p>

          <Form>
            <Form.Group className="mb-3" controlId="loginEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="login-actions">
              <Button type="button" variant="dark" className="login-submit-btn" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? <><Spinner animation="border" size="sm" className="me-2" />Logging in...</> : 'Log In'}
              </Button>
            </div>
          </Form>

          <p className="login-footer-text">New here? Sign up from the top-right button.</p>
        </Card.Body>
      </Card>
    </div>
  )
}
