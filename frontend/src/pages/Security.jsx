import { useState } from 'react'
import api from '../api/axios'
import { toast } from '../components/Toast'

export default function Security() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast('Mật khẩu xác nhận không khớp', 'error')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast('Đổi mật khẩu thành công')
    } catch (err) {
      toast(err.response?.data?.error || 'Không thể đổi mật khẩu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bảo mật tài khoản</h1>
        <p>Đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
      </div>
      <div className="card">
        <form onSubmit={submit} className="form-grid">
          <label>Mật khẩu hiện tại<input type="password" required minLength={8} value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
          <label>Mật khẩu mới<input type="password" required minLength={8} maxLength={128} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></label>
          <label>Nhập lại mật khẩu mới<input type="password" required minLength={8} maxLength={128} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
        </form>
      </div>
    </div>
  )
}
