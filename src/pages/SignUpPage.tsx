import { useMemo, useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import './SignUpPage.css'

const steps = ['Account', 'Profile', 'Bio', 'Review']

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [bio, setBio] = useState('')

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
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
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

                <Form.Group className="mb-0" controlId="signupBirthday">
                  <Form.Label>Birthday</Form.Label>
                  <Form.Control type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
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
                <p><strong>Confirm Password:</strong> {passwordConfirmation ? '********' : 'Not entered yet'}</p>
                <p><strong>First Name:</strong> {firstName || 'Not entered yet'}</p>
                <p><strong>Last Name:</strong> {lastName || 'Not entered yet'}</p>
                <p><strong>Birthday:</strong> {birthday || 'Not entered yet'}</p>
                <p><strong>Bio:</strong> {bio || 'Not entered yet'}</p>
                <p className="signup-review-note">Design-only preview. Create account action will be wired later.</p>
              </div>
            ) : null}
          </div>

          <div className="signup-actions">
            <Button type="button" variant="outline-secondary" onClick={handleBack} disabled={currentStep === 0}>Back</Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" variant="dark" onClick={handleNext}>Next Step</Button>
            ) : (
              <Button type="button" variant="success">Create Account</Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
