import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import api from '../api/axios'

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      api.get('/jobs', { params: { keyword: search, jobType, page, pageSize: 10 } })
      .then((res) => {
        setJobs(Array.isArray(res.data) ? res.data : res.data?.data || [])
        setPagination(res.data?.pagination || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [search, jobType, page])

  if (loading) return <div className="loading">Đang tải...</div>

  return (
    <div className="browse-jobs-page">
      <div className="page-header">
        <div>
          <h1>Việc làm đang tuyển</h1>
          <p>{pagination?.total ?? jobs.length} việc làm phù hợp</p>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">&#128269;</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, công ty, địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>&times;</button>
          )}
        </div>
        <select value={jobType} onChange={(e) => { setJobType(e.target.value); setPage(1) }}>
          <option value="">Tất cả loại việc</option>
          <option value="FullTime">Toàn thời gian</option>
          <option value="PartTime">Bán thời gian</option>
          <option value="Internship">Thực tập</option>
        </select>
      </div>

      <div className="browse-job-list">
        {jobs.map((job) => (
          <Link to={`/jobs/${job.id}`} key={job.id} className="browse-job-card">
            <div className="browse-job-left">
              <div className="browse-job-avatar">{job.company?.charAt(0) || 'J'}</div>
            </div>
            <div className="browse-job-body">
              <h3>{job.title}</h3>
              <div className="browse-job-meta">
                {job.company && (
                  <span className="browse-job-tag company-tag">{job.company}</span>
                )}
                {job.location && (
                  <span className="browse-job-tag location-tag">{job.location}</span>
                )}
                {job.salary && (
                  <span className="browse-job-tag salary-tag">{job.salary}</span>
                )}
              </div>
              <p className="browse-job-desc">{job.description}</p>
            </div>
            <div className="browse-job-right">
              <span className="browse-job-arrow">&rarr;</span>
            </div>
          </Link>
        ))}
        {jobs.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-icon">&#128270;</div>
            <h3>Không tìm thấy việc làm</h3>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
          <span>Trang {pagination.page}/{pagination.totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}
    </div>
  )
}
