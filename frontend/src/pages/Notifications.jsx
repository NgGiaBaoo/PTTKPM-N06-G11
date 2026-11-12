import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const response = await api.get('/notifications')
      setItems(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải thông báo')
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: 1 } : item))
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setItems((current) => current.map((item) => ({ ...item, isRead: 1 })))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Thông báo</h1>
          <p>Thông tin cập nhật liên quan đến tài khoản và hồ sơ của bạn.</p>
        </div>
        <button className="btn btn-secondary" onClick={markAllRead}>Đánh dấu tất cả đã đọc</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        {items.length === 0 ? <p>Chưa có thông báo.</p> : items.map((item) => (
          <article key={item.id} className={`notification-item ${item.isRead ? '' : 'unread'}`}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
            </div>
            {!item.isRead && <button className="btn btn-secondary" onClick={() => markRead(item.id)}>Đã đọc</button>}
          </article>
        ))}
      </div>
    </div>
  )
}
