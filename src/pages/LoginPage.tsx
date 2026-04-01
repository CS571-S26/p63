import { Button, Card, Form } from 'react-bootstrap'
import './LoginPage.css'

export default function LoginPage() {
  return (
    <div className="login-page">
      <Card className="login-card">
        <Card.Body>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Log in to continue rating roommates.</p>

          <Form>
            <Form.Group className="mb-3" controlId="loginEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" placeholder="Enter your email" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Enter your password" />
            </Form.Group>

            <div className="login-actions">
              <Button type="button" variant="dark" className="login-submit-btn">Log In</Button>
            </div>
          </Form>

          <p className="login-footer-text">New here? Sign up from the top-right button.</p>
        </Card.Body>
      </Card>
    </div>
  )
}
