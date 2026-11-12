import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users')
      .then((res) => setUsers(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    try {
      await api.delete(`/users/${id}`)
      setUsers(users.filter((u) => u.id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Xóa thất bại')
    }

    const changeStatus = async (user, status) => {
      try {
        await api.post(`/users/${user.id}/status`, { status })
        setUsers((current) => current.map((item) => item.id === user.id ? { ...item, accountStatus: status } : item))
      } catch (err) {
        alert(err.response?.data?.error || 'Cập nhật trạng thái thất bại')
      }
    }
  }

  if (loading) return <div className="loading">Đang tải...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý Người dùng</h1>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên đăng nhập</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.role || '--'}</td>
                <td>{u.accountStatus || '--'}</td>
                <td className="actions">
                  {u.accountStatus === 'Locked'
                    ? <button className="btn btn-sm btn-edit" onClick={() => changeStatus(u, 'Active')}>Mở khóa</button>
                    : <button className="btn btn-sm btn-secondary" onClick={() => changeStatus(u, 'Locked')}>Khóa</button>}
                  <button className="btn btn-sm btn-delete" onClick={() => handleDelete(u.id)}>Xóa</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-center">Chưa có người dùng</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
