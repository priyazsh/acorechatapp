import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const e = []
    if (!name.trim() || name.trim().length < 2) e.push('Name must be at least 2 characters')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.push('Invalid email address')
    if (!password || password.length < 6) e.push('Password must be at least 6 characters')
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
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      })
      const data = await res.json()
      setSubmitting(false)
      if (!res.ok) return setErrors(data.errors || ['Registration failed'])
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
        <p className="subtitle">Create your account</p>
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((e, i) => <p key={i} className="error">{e}</p>)}
          </div>
        )}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register'}
        </button>
        <p className="switch">
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
