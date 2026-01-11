import { useState } from 'preact/hooks'
import { api } from '../../api/client.js'
import { t } from '../../i18n/index.js'

export function CreateUserModal({ onClose, onCreated }) {
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
        <h3 class="font-bold text-lg mb-4">{t('admin.createUser')}</h3>
        {error && <div class="alert alert-error mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">{t('login.username')}</span></label>
            <input
              type="text"
              class="input input-bordered"
              value={form.username}
              onInput={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">{t('login.password')}</span></label>
            <input
              type="password"
              class="input input-bordered"
              value={form.password}
              onInput={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div class="form-control mb-2">
            <label class="label"><span class="label-text">{t('admin.fullName')}</span></label>
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
              <span class="label-text">{t('admin.administrator')}</span>
            </label>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? <span class="loading loading-spinner loading-sm"></span> : t('common.create')}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
