import { t } from '../../i18n/index.js'
import { DocView } from '../docs/DocView.jsx'

export function AboutDialog({ show, onClose }) {
  return (
    <dialog class={`modal ${show ? 'modal-open' : ''}`}>
      <div class="modal-box max-w-4xl max-h-[85vh] flex flex-col">
        <div class="flex-none flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">{t('docs.aboutTitle')}</h3>
          <button class="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto pr-2">
          <DocView slug="about" />
        </div>

        <div class="flex-none modal-action">
          <button class="btn btn-sm" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
