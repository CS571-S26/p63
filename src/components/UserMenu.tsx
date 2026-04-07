import { useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import './UserMenu.css'

export default function UserMenu() {
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut(auth)
      navigate('/', { state: { feedback: 'You have been logged out.' } })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        id="user-menu-toggle"
        variant=""
        className="rmp-profile-icon-btn"
        aria-label="Open account menu"
      >
        <svg
          className="rmp-user-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
          <path d="M5 19c0-3.2 3.2-5 7-5s7 1.8 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Dropdown.Toggle>

      <Dropdown.Menu className="rmp-user-menu">
        <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}
