import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import api from '../api/axios'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') || '')
  const [email, setEmail] = useState(params.get('email') || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await api.post('/auth/verify-email', { token })
      setMessage(response.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể xác minh email')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    setMessage('')
    try {
      const response = await api.post('/auth/resend-verification', { email })
      setMessage(response.data.message)
      if (response.data.verificationUrl) setToken(response.data.verificationUrl.split('token=')[1] || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể gửi lại email')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Xác minh email</h1>
          <p>Nhập mã trong email hoặc dùng liên kết xác minh.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form onSubmit={verify}>
          <div className="form-group">
            <label htmlFor="verification-token">Mã xác minh</label>
            <input id="verification-token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang xác minh...' : 'Xác minh email'}
          </button>
        </form>
        <div className="form-group">
          <label htmlFor="verification-email">Gửi lại đến email</label>
          <input id="verification-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="btn btn-secondary btn-full" onClick={resend} disabled={!email}>
            Gửi lại email
          </button>
        </div>
        <div className="auth-footer"><Link to="/login">Quay lại đăng nhập</Link></div>
      </div>
    </div>
  )
}
