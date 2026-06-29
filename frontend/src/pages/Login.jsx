import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const e = []
    if (!email) e.push('Email is required')
    if (!password) e.push('Password is required')
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const validationErrors = validate()
    if (validationErrors.length) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      setSubmitting(false)
      if (!res.ok) return setErrors(data.errors || ['Login failed'])
      login(data.token, data.user)
      navigate('/')
    } catch {
      setSubmitting(false)
      setErrors(['Connection failed'])
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <h1>Acore Chat</h1>
        <p className="subtitle">Sign in</p>
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e, i) => <p key={i} className="error">{e}</p>)}
          </div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="switch">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  )
}
