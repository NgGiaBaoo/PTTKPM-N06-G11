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
        {items.length === 0 ? <p>Không có yêu cầu đang chờ.</p> : (
          <div className="employer-app-cards">
            {items.map((item) => (
              <article className="employer-app-card" key={item.id} style={{ borderLeftColor: '#2563eb' }}>
                <div className="eapp-job-section">
                  <div className="eapp-job-icon">&#127970;</div>
                  <div className="eapp-job-info">
                    <h3>{item.companyName}</h3>
                    <div className="eapp-job-meta">
                      <span className="eapp-job-tag location">{item.industry || 'Chưa cập nhật lĩnh vực'}</span>
                      <span className="eapp-job-tag salary">Mã: {item.businessCode || '--'}</span>
                    </div>
                  </div>
                </div>

                <div className="eapp-candidate-section">
                  <div className="eapp-header">
                    <div className="eapp-candidate-info">
                      <div className="eapp-avatar">{(item.companyName || '?').charAt(0).toUpperCase()}</div>
                      <div>
                        <h3>Hồ sơ doanh nghiệp</h3>
                        <span className="eapp-candidate-sub">
                          Gửi ngày {new Date(item.submittedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="eapp-status" style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
                      ⏳ Chờ xử lý
                    </div>
                  </div>

                  <div className="eapp-body">
                    <div className="eapp-detail-grid">
                      <div className="eapp-detail-item">
                        <span className="eapp-detail-label">Email</span>
                        <span className="eapp-detail-value">{item.email || '--'}</span>
                      </div>
                      <div className="eapp-detail-item">
                        <span className="eapp-detail-label">Số điện thoại</span>
                        <span className="eapp-detail-value">{item.phone || '--'}</span>
                      </div>
                      <div className="eapp-detail-item">
                        <span className="eapp-detail-label">Địa chỉ</span>
                        <span className="eapp-detail-value">{item.address || '--'}</span>
                      </div>
                      <div className="eapp-detail-item">
                        <span className="eapp-detail-label">Giới thiệu</span>
                        <span className="eapp-detail-value">{item.description || '--'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="eapp-footer">
                  <div className="eapp-actions">
                    <button className="btn btn-approve btn-with-icon" onClick={() => review(item, 'Approved')}>
                      <span>✅</span> Chấp thuận
                    </button>
                    <button className="btn btn-reject btn-with-icon" onClick={() => review(item, 'Rejected')}>
                      <span>❌</span> Từ chối
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
