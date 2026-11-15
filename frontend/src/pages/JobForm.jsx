import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { toast } from '../components/Toast'

export default function JobForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({
    title: '', company: '', location: '', salary: '', jobType: 'FullTime',
    deadline: '', requirements: '', benefits: '', description: '', status: 'Draft'
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    const load = async () => {
      if (isEdit) {
        try {
          const res = await api.get(`/jobs/${id}`)
          const job = res.data?.data || res.data
          setForm({
            title: job.title || '',
            company: job.company || '',
            location: job.location || '',
            salary: job.salary || '',
            description: job.description || '',
            jobType: job.jobType || 'FullTime',
            deadline: job.deadline ? String(job.deadline).slice(0, 10) : '',
            requirements: job.requirements || '',
            benefits: job.benefits || '',
            status: job.status || 'Draft',
          })
        } catch {
          alert('Không tìm thấy tin tuyển dụng')
          navigate('/jobs')
        } finally {
          setFetching(false)
        }
      } else if (user?.role === 'Employer') {
        try {
          const empRes = await api.get(`/employers/by-user/${user.id}`)
          const emp = empRes.data
          if (emp?.companyName) {
            setForm((prev) => ({ ...prev, company: emp.companyName }))
          }
        } catch {
        } finally {
          setFetching(false)
        }
      } else {
        setFetching(false)
      }
    }
    load()
  }, [id, isEdit, navigate, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, form)
      } else {
        await api.post('/jobs', form)
      }
      navigate('/jobs')
    } catch (err) {
      toast(err.response?.data?.error || 'Lưu thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="loading">Đang tải...</div>

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Thêm tin tuyển dụng mới'}</h1>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ví dụ: Lập trình viên React"
              required
            />
          </div>
          <div className="form-group">
            <label>Công ty</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Tên công ty"
              readOnly={user?.role === 'Employer'}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Địa điểm</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ví dụ: Hồ Chí Minh"
              />
            </div>
            <div className="form-group">
              <label>Loại công việc</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                <option value="FullTime">Toàn thời gian</option>
                <option value="PartTime">Bán thời gian</option>
                <option value="Internship">Thực tập</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mức lương</label>
              <input
                type="text"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="Ví dụ: 2000 USD"
              />
            </div>
            <div className="form-group">
              <label>Hạn nhận hồ sơ</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Trạng thái tin</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Draft">Bản nháp (chưa hiển thị cho sinh viên)</option>
              <option value="Published">Đăng công khai</option>
              <option value="Closed">Đóng nhận hồ sơ</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Yêu cầu ứng viên</label>
              <textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Quyền lợi</label>
              <textarea rows={3} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chi tiết về công việc"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/jobs')}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
