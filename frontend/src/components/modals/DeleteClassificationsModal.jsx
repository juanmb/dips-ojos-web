import { t } from '../../i18n/index.js'

export function DeleteClassificationsModal({ curveId, onClose, onConfirm, deleting }) {
  return (
    <dialog class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">{t('classification.deleteAllTitle')}</h3>
        <div class="py-4">
          <div class="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{t('classification.deleteWarning')}</span>
          </div>
          <p>{t('classification.deleteConfirm')} <strong>{t('curves.curve', { id: curveId })}</strong>?</p>
          <p class="text-sm opacity-70 mt-2">{t('classification.deleteInfo')}</p>
        </div>
        <div class="modal-action">
          <button
            class="btn btn-ghost"
            onClick={onClose}
            disabled={deleting}
          >
            {t('common.cancel')}
          </button>
          <button
            class={`btn btn-error ${deleting ? 'loading' : ''}`}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? t('classification.deleting') : t('classification.deleteAll')}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
