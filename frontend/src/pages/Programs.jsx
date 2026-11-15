import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const emptyForm = { name: '', schoolId: '', description: '', startDate: '', endDate: '', location: '', status: 'Draft' }

const statusLabels = {
  Draft: 'Bản nháp',
  Open: 'Đang mở đăng ký',
  Closed: 'Đã kết thúc',
  Cancelled: 'Đã hủy',
}

function formatDate(value) {
  if (!value) return 'Chưa xác định'
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function Programs() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadPrograms = async () => {
    try {
      const response = await api.get('/programs')
      setPrograms(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải chương trình')
    }
  }

  useEffect(() => { loadPrograms() }, [])

  const createProgram = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.post('/programs', form)
      setForm(emptyForm)
      setMessage('Đã tạo chương trình kết nối')
      await loadPrograms()
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tạo chương trình')
    }
  }

  const participate = async (program) => {
    setMessage('')
    setError('')
    try {
      const action = user.role === 'Student' ? 'register' : 'join'
      await api.post(`/programs/${program.id}/${action}`)
      setMessage('Đăng ký tham gia thành công')
      await loadPrograms()
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể đăng ký tham gia')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Chương trình kết nối</h1>
          <p>Hoạt động kết nối sinh viên, doanh nghiệp và nhà trường</p>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {(user.role === 'SchoolStaff' || user.role === 'Admin') && (
        <form className="card form-grid" onSubmit={createProgram}>
          <h2>Tạo chương trình mới</h2>
          <input name="name" placeholder="Tên chương trình" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          {user.role === 'Admin' && (
            <input name="schoolId" type="number" min="1" placeholder="Mã trường" value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} required />
          )}
          <input name="location" placeholder="Địa điểm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input name="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <input name="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          <textarea name="description" placeholder="Mô tả chương trình" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Draft">Bản nháp</option>
            <option value="Open">Đang mở đăng ký</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
          <button className="btn btn-primary" type="submit">Tạo chương trình</button>
        </form>
      )}
      <div className="program-list-section">
        <div className="section-heading">
          <div>
            <h2>Chương trình nổi bật</h2>
            <p>Khám phá các hoạt động kết nối và cơ hội nghề nghiệp</p>
          </div>
          <span className="program-count">{programs.length} chương trình</span>
        </div>
        {programs.length === 0 ? <div className="card"><p>Chưa có chương trình nào.</p></div> : (
          <div className="program-banner-list">
            {programs.map((program) => (
              <article className={`program-banner program-status-${program.status?.toLowerCase()}`} key={program.id}>
                <div className="program-banner-art">
                  <span className="program-banner-icon">&#127891;</span>
                  <span className="program-banner-shape shape-one" />
                  <span className="program-banner-shape shape-two" />
                </div>
                <div className="program-banner-content">
                  <div className="program-banner-topline">
                    <span className="program-eyebrow">CHƯƠNG TRÌNH KẾT NỐI</span>
                    <span className="program-status">{statusLabels[program.status] || program.status}</span>
                  </div>
                  <h3>{program.name}</h3>
                  <p className="program-description">{program.description || 'Cơ hội kết nối sinh viên, doanh nghiệp và nhà trường.'}</p>
                  <div className="program-banner-meta">
                    <span>&#128197; {formatDate(program.startDate)} - {formatDate(program.endDate)}</span>
                    <span>&#128205; {program.location || 'Chưa xác định địa điểm'}</span>
                  </div>
                  <div className="program-banner-footer">
                    <div className="program-participants">
                      <span>&#128100; {program.studentCount || 0} sinh viên</span>
                      <span>&#127970; {program.employerCount || 0} doanh nghiệp</span>
                    </div>
                    {(user.role === 'Student' || user.role === 'Employer') && program.status === 'Open' && (
                      <button className="btn btn-light" onClick={() => participate(program)}>
                        {user.role === 'Student' ? 'Đăng ký tham gia' : 'Đăng ký doanh nghiệp'}
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    )}
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
