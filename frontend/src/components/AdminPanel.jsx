import { useEffect, useState } from 'preact/hooks'
import { api } from '../api/client.js'

export function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sortColumn, setSortColumn] = useState('fullname')
  const [sortDirection, setSortDirection] = useState('asc')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id)
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const getProgressPercent = (user) => {
    if (!user.total_transits) return 0
    return Math.round((user.classified_transits / user.total_transits) * 100)
  }

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'progress-success'
    if (percent >= 50) return 'progress-info'
    if (percent >= 25) return 'progress-warning'
    return 'progress-error'
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    let aVal, bVal

    switch (sortColumn) {
      case 'fullname':
        aVal = a.fullname.toLowerCase()
        bVal = b.fullname.toLowerCase()
        break
      case 'progress':
        aVal = a.total_transits ? a.classified_transits / a.total_transits : 0
        bVal = b.total_transits ? b.classified_transits / b.total_transits : 0
        break
      case 'last_activity':
        aVal = a.last_activity || ''
        bVal = b.last_activity || ''
        break
      case 'is_admin':
        aVal = a.is_admin ? 1 : 0
        bVal = b.is_admin ? 1 : 0
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <span class="opacity-30 ml-1">↕</span>
    }
    return <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div class="p-4 h-full overflow-auto">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">User Administration</h1>
        <button class="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
          + New User
        </button>
      </div>

      {error && (
        <div class="alert alert-error mb-4">
          <span>{error}</span>
          <button class="btn btn-ghost btn-xs" onClick={() => setError(null)}>X</button>
        </div>
      )}

      {loading ? (
        <div class="flex justify-center p-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('fullname')}
                >
                  User<SortIcon column="fullname" />
                </th>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('progress')}
                >
                  Progress<SortIcon column="progress" />
                </th>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('last_activity')}
                >
                  Last Activity<SortIcon column="last_activity" />
                </th>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('is_admin')}
                >
                  Admin<SortIcon column="is_admin" />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(user => {
                const percent = getProgressPercent(user)
                return (
                  <tr key={user.id} class="hover">
                    <td>
                      <a href={`/admin/users/${user.id}`} class="block">
                        <div class="font-bold hover:text-primary">{user.fullname}</div>
                        <div class="text-sm opacity-50">@{user.username}</div>
                      </a>
                    </td>
                    <td>
                      <a href={`/admin/users/${user.id}`} class="block">
                        <div class="flex items-center gap-2">
                          <progress
                            class={`progress ${getProgressColor(percent)} w-24`}
                            value={percent}
                            max="100"
                          ></progress>
                          <span class="text-sm opacity-70 whitespace-nowrap">
                            {user.classified_transits} / {user.total_transits}
                          </span>
                        </div>
                        <div class="text-xs opacity-50">{percent}%</div>
                      </a>
                    </td>
                    <td class="text-sm opacity-70">
                      {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      {user.is_admin && <span class="badge badge-primary badge-sm">Admin</span>}
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <button
                          class="btn btn-ghost btn-xs"
                          onClick={() => setEditingUser(user)}
                        >
                          Edit
                        </button>
                        <button
                          class="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteConfirm(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <CreateUserModal
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false)
            loadUsers()
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            setEditingUser(null)
            loadUsers()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete User</h3>
            <p class="py-4">
              Are you sure you want to delete <strong>{deleteConfirm.fullname}</strong>?
              This will also delete all their classifications.
            </p>
            <div class="modal-action">
              <button class="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button class="btn btn-error" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setDeleteConfirm(null)}></div>
        </div>
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', password: '', fullname: '', is_admin: false })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.createUser(form)
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Create New User</h3>
        {error && <div class="alert alert-error mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">Username</span></label>
            <input
              type="text"
              class="input input-bordered"
              value={form.username}
              onInput={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">Password</span></label>
            <input
              type="password"
              class="input input-bordered"
              value={form.password}
              onInput={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">Full Name</span></label>
            <input
              type="text"
              class="input input-bordered"
              value={form.fullname}
              onInput={e => setForm({ ...form, fullname: e.target.value })}
              required
            />
          </div>
          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                class="checkbox"
                checked={form.is_admin}
                onChange={e => setForm({ ...form, is_admin: e.target.checked })}
              />
              <span class="label-text">Administrator</span>
            </label>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onClick={onClose}>Cancel</button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? <span class="loading loading-spinner loading-sm"></span> : 'Create'}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

function EditUserModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({ fullname: user.fullname, is_admin: user.is_admin })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.updateUser(user.id, form)
      onUpdated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Edit User: {user.username}</h3>
        {error && <div class="alert alert-error mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">Full Name</span></label>
            <input
              type="text"
              class="input input-bordered"
              value={form.fullname}
              onInput={e => setForm({ ...form, fullname: e.target.value })}
              required
            />
          </div>
          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                class="checkbox"
                checked={form.is_admin}
                onChange={e => setForm({ ...form, is_admin: e.target.checked })}
              />
              <span class="label-text">Administrator</span>
            </label>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onClick={onClose}>Cancel</button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? <span class="loading loading-spinner loading-sm"></span> : 'Save'}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
