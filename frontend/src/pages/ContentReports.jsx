import { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from '../components/Toast'

export default function ContentReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/content-reports?status=Pending')
      .then((response) => setReports(response.data.data || []))
      .catch((err) => toast(err.response?.data?.error || 'Không thể tải báo cáo', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const review = async (id, status) => {
    const resolution = window.prompt('Nhập lý do xử lý') || ''
    if (!resolution.trim()) return
    try {
      await api.post(`/content-reports/${id}/review`, { status, resolution })
      toast('Đã xử lý báo cáo')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Không thể xử lý báo cáo', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Báo cáo nội dung</h1><p>Danh sách nội dung đang chờ Admin xử lý.</p></div>
      {loading ? <div className="loading">Đang tải...</div> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Nội dung</th><th>Người báo cáo</th><th>Lý do</th><th>Thời gian</th><th>Thao tác</th></tr></thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.entityType} #{report.entityId}</td>
                  <td>{report.reporter}</td>
                  <td>{report.reason}</td>
                  <td>{new Date(report.createdAt).toLocaleString()}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-delete" onClick={() => review(report.id, 'Actioned')}>Tạm ngưng</button>
                    <button className="btn btn-sm btn-view" onClick={() => review(report.id, 'Dismissed')}>Bỏ qua</button>
                  </td>
                </tr>
              ))}
              {!reports.length && <tr><td colSpan={5} className="text-center">Không có báo cáo chờ xử lý</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
