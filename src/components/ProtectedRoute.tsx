import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<'loading' | 'signed-in' | 'signed-out'>('loading')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState(user ? 'signed-in' : 'signed-out')
    })

    return () => unsubscribe()
  }, [])

  if (authState === 'loading') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '45vh' }}>
        <Spinner animation="border" />
      </div>
    )
  }

  if (authState === 'signed-out') {
    return <Navigate to="/login" replace />
  }

  return children
}
