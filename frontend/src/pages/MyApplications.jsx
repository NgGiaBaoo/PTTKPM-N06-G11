import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const statusConfig = {
  Submitted: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
  UnderReview: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🔎' },
  Accepted: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' },
  Rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
}

export default function MyApplications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const canRes = await api.get(`/candidates/by-user/${user.id}`)
        const candidate = canRes.data?.data
        if (!candidate) {
          setLoading(false)
          return
        }
        const appsRes = await api.get(`/applications?candidateId=${candidate.id}`)
        const data = Array.isArray(appsRes.data) ? appsRes.data : appsRes.data?.data || appsRes.data || []
        setApps(data)
      } catch (err) {
        if (err.response?.status !== 404) console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  if (loading) return <div className="loading">Đang tải...</div>

  return (
    <div className="my-apps-page">
      <div className="page-header">
        <h1>Đơn đã nộp</h1>
        <p>Theo dõi trạng thái đơn ứng tuyển của bạn</p>
      </div>

      {apps.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">&#128203;</div>
          <h3>Chưa có đơn ứng tuyển</h3>
          <p>Bạn chưa nộp đơn ứng tuyển nào.</p>
          <button className="btn btn-primary" onClick={() => navigate('/jobs/browse')}>
            Xem việc làm
          </button>
        </div>
      ) : (
        <div className="application-cards">
          {apps.map((app) => {
            const rawStatus = app.Status || app.status || 'Unknown'
            const status = rawStatus
            const cfg = statusConfig[status] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: '❓' }
            return (
              <div key={app.ApplicationID || app.id} className="application-card" style={{ borderLeftColor: cfg.color }}>
                <div className="app-card-header">
                  <div className="app-job-info">
                    <h3>{app.JobTitle || app.jobTitle || `Job #${app.jobId || app.JobID}`}</h3>
                    <span className="app-company">{app.CompanyName || app.companyName || 'Công ty'}</span>
                  </div>
                  <div className="app-status-badge" style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                    {cfg.icon} {status === 'Accepted' ? 'Được chấp nhận' : status === 'UnderReview' ? 'Đang xem xét' : status === 'Rejected' ? 'Từ chối' : status === 'Withdrawn' ? 'Đã rút' : 'Đã nộp'}
                  </div>
                </div>
                <div className="app-card-body">
                  <div className="app-detail">
                    <span className="app-detail-label">Ngày nộp</span>
                    <span className="app-detail-value">{app.ApplyDate || app.applyDate ? new Date(app.ApplyDate || app.applyDate).toLocaleDateString('vi-VN') : '--'}</span>
                  </div>
                  <div className="app-detail">
                    <span className="app-detail-label">Mã đơn</span>
                    <span className="app-detail-value">#{app.ApplicationID || app.id}</span>
                  </div>
                </div>
                <div className="app-card-footer">
                  <div className="status-timeline">
                    <div className={`timeline-dot ${status === 'Submitted' ? 'active' : ''} ${status !== 'Submitted' ? 'done' : ''}`}>
                      <span>1</span>
                    </div>
                    <div className={`timeline-line ${status !== 'Submitted' ? 'done' : ''}`}></div>
                    <div className={`timeline-dot ${status === 'UnderReview' ? 'active' : ''} ${['Accepted', 'Rejected'].includes(status) ? 'done' : ''}`}>
                      <span>2</span>
                    </div>
                    <div className={`timeline-line ${['Accepted', 'Rejected'].includes(status) ? 'done rejected' : ''}`}></div>
                    <div className={`timeline-dot ${status === 'Rejected' ? 'active rejected' : ''} ${status === 'Accepted' ? 'done' : ''}`}>
                      <span>3</span>
                    </div>
                  </div>
                  <div className="timeline-labels">
                    <span className={status === 'Submitted' ? 'label-active' : ''}>Đã nộp</span>
                    <span className={status === 'UnderReview' ? 'label-active' : ''}>Xem xét</span>
                    <span className={status === 'Accepted' ? 'label-active' : status === 'Rejected' ? 'label-rejected' : ''}>
                      {status === 'Rejected' ? 'Từ chối' : 'Hoàn tất'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
