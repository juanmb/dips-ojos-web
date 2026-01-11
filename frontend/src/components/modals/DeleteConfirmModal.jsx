import { t } from '../../i18n/index.js'

export function DeleteConfirmModal({ title, message, info, onClose, onConfirm, confirming }) {
  return (
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{title}</h3>
        <p class="py-4">{message}</p>
        {info && <p class="text-sm opacity-70">{info}</p>}
        <div class="modal-action">
          <button class="btn" onClick={onClose} disabled={confirming}>
            {t('common.cancel')}
          </button>
          <button class="btn btn-error" onClick={onConfirm} disabled={confirming}>
            {confirming ? <span class="loading loading-spinner loading-sm"></span> : t('common.delete')}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
