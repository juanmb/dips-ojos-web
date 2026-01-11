import { t } from '../../i18n/index.js'

export function HelpDialog({ show, onClose }) {
  return (
    <dialog class={`modal ${show ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{t('help.title')}</h3>

        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-sm opacity-70 mb-2">{t('help.transitNav')}</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><kbd class="kbd kbd-sm">←</kbd> or <kbd class="kbd kbd-sm">A</kbd></div>
              <div>{t('help.prevTransit')}</div>
              <div><kbd class="kbd kbd-sm">→</kbd> or <kbd class="kbd kbd-sm">D</kbd></div>
              <div>{t('help.nextTransit')}</div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-sm opacity-70 mb-2">{t('help.curveNav')}</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><kbd class="kbd kbd-sm">↑</kbd> or <kbd class="kbd kbd-sm">W</kbd></div>
              <div>{t('help.prevCurve')}</div>
              <div><kbd class="kbd kbd-sm">↓</kbd> or <kbd class="kbd kbd-sm">S</kbd></div>
              <div>{t('help.nextCurve')}</div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-sm opacity-70 mb-2">{t('help.general')}</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><kbd class="kbd kbd-sm">?</kbd> or <kbd class="kbd kbd-sm">H</kbd></div>
              <div>{t('help.toggleHelp')}</div>
              <div><kbd class="kbd kbd-sm">Esc</kbd></div>
              <div>{t('help.closeDialog')}</div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-sm" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
