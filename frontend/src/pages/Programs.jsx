import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const emptyForm = { name: '', schoolId: '', description: '', startDate: '', endDate: '', location: '', status: 'Draft' }

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
      <div className="card">
        <h2>Danh sách chương trình</h2>
        {programs.length === 0 ? <p>Chưa có chương trình nào.</p> : programs.map((program) => (
          <article className="program-item" key={program.id}>
            <div>
              <h3>{program.name}</h3>
              <p>{program.description || 'Chưa có mô tả'}</p>
              <small>{program.startDate} - {program.endDate} · {program.location || 'Chưa xác định'}</small>
              <small>{program.studentCount} sinh viên · {program.employerCount} doanh nghiệp</small>
            </div>
            {(user.role === 'Student' || user.role === 'Employer') && program.status === 'Open' && (
              <button className="btn btn-secondary" onClick={() => participate(program)}>
                {user.role === 'Student' ? 'Đăng ký tham gia' : 'Đăng ký doanh nghiệp'}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
