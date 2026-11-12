import { useState } from 'react'
import { Link } from 'react-router'
import api from '../api/axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetUrl, setResetUrl] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setResetUrl('')
    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.data.message)
      if (response.data.resetUrl) setResetUrl(response.data.resetUrl)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể gửi yêu cầu khôi phục')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header"><h1>Quên mật khẩu</h1><p>Nhập email đã đăng ký.</p></div>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {resetUrl && <div className="alert alert-info">Môi trường phát triển: <a href={resetUrl}>Mở liên kết khôi phục</a></div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-full">Gửi liên kết khôi phục</button>
        </form>
        <div className="auth-footer"><Link to="/login">Quay lại đăng nhập</Link></div>
      </div>
    </div>
  )
}
