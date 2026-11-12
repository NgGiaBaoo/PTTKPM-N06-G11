import { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from '../components/Toast'

export default function VerificationRequests() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const response = await api.get('/verification-requests')
      setItems(response.data)
    } catch (err) {
      toast(err.response?.data?.error || 'Không thể tải yêu cầu xác minh', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const review = async (item, status) => {
    const reason = window.prompt(status === 'Rejected' ? 'Lý do từ chối:' : 'Ghi chú xử lý (không bắt buộc):', '')
    if (reason === null) return
    try {
      await api.post(`/verification-requests/${item.id}/review`, { status, reason })
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      toast(status === 'Approved' ? 'Đã xác minh doanh nghiệp' : 'Đã từ chối yêu cầu')
    } catch (err) {
      toast(err.response?.data?.error || 'Không thể xử lý yêu cầu', 'error')
    }
  }

  if (loading) return <div className="loading">Đang tải...</div>
  return (
    <div className="page">
      <div className="page-header">
        <h1>Yêu cầu xác minh doanh nghiệp</h1>
        <p>{items.length} yêu cầu đang chờ xử lý</p>
      </div>
      <div className="card">
        {items.length === 0 ? <p>Không có yêu cầu đang chờ.</p> : items.map((item) => (
          <article className="notification-item" key={item.id}>
            <div>
              <h3>{item.companyName}</h3>
              <p>Mã doanh nghiệp: {item.businessCode || '--'}</p>
              <small>Gửi ngày {new Date(item.submittedAt).toLocaleString('vi-VN')}</small>
            </div>
            <div>
              <button className="btn btn-primary" onClick={() => review(item, 'Approved')}>Chấp thuận</button>{' '}
              <button className="btn btn-delete" onClick={() => review(item, 'Rejected')}>Từ chối</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
