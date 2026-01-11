import { useEffect, useState } from 'preact/hooks'
import { api } from '../api/client.js'
import { t } from '../i18n/index.js'
import { CreateUserModal } from './modals/CreateUserModal.jsx'
import { EditUserModal } from './modals/EditUserModal.jsx'
import { DeleteConfirmModal } from './modals/DeleteConfirmModal.jsx'

export function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
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
      setDeleting(true)
      await api.deleteUser(id)
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
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
        <h1 class="text-2xl font-bold">{t('admin.title')}</h1>
        <button class="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
          {t('admin.newUser')}
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
                  {t('admin.user')}<SortIcon column="fullname" />
                </th>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('progress')}
                >
                  {t('admin.progress')}<SortIcon column="progress" />
                </th>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('last_activity')}
                >
                  {t('admin.lastActivity')}<SortIcon column="last_activity" />
                </th>
                <th
                  class="cursor-pointer hover:bg-base-300 select-none"
                  onClick={() => handleSort('is_admin')}
                >
                  {t('admin.isAdmin')}<SortIcon column="is_admin" />
                </th>
                <th>{t('common.actions')}</th>
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
                      {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : t('common.never')}
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
                          {t('common.edit')}
                        </button>
                        <button
                          class="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteConfirm(user)}
                        >
                          {t('common.delete')}
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

      {showCreateForm && (
        <CreateUserModal
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false)
            loadUsers()
          }}
        />
      )}

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

      {deleteConfirm && (
        <DeleteConfirmModal
          title={t('admin.deleteUser')}
          message={<>{t('admin.deleteConfirm')} <strong>{deleteConfirm.fullname}</strong>?</>}
          info={t('admin.deleteInfo')}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          confirming={deleting}
        />
      )}
    </div>
  )
}
