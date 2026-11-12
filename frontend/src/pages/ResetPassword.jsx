import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import api from '../api/axios'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setError('')
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword: password })
      setMessage(response.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể đặt lại mật khẩu')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header"><h1>Đặt lại mật khẩu</h1><p>Mã khôi phục chỉ dùng một lần.</p></div>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label>Mã khôi phục<input value={token} onChange={(e) => setToken(e.target.value)} required /></label></div>
          <div className="form-group"><label>Mật khẩu mới<input type="password" minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required /></label></div>
          <div className="form-group"><label>Nhập lại mật khẩu<input type="password" minLength={8} maxLength={128} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label></div>
          <button className="btn btn-primary btn-full">Đặt lại mật khẩu</button>
        </form>
        <div className="auth-footer"><Link to="/login">Quay lại đăng nhập</Link></div>
      </div>
    </div>
  )
}
