import { useState, useEffect } from 'preact/hooks'
import { t } from '../../i18n/index.js'
import { DocView } from '../docs/DocView.jsx'
import { DownloadsView } from '../docs/DownloadsView.jsx'

const TABS = [
  { id: 'about', labelKey: 'docs.aboutTitle' },
  { id: 'tutorial', labelKey: 'docs.tutorialTitle' },
  { id: 'examples', labelKey: 'docs.examplesTitle' },
  { id: 'downloads', labelKey: 'docs.downloadsTitle' },
]

export function HelpDialog({ show, onClose }) {
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    if (show) setActiveTab('about')
  }, [show])

  return (
    <dialog class={`modal ${show ? 'modal-open' : ''}`}>
      <div class="modal-box max-w-4xl max-h-[85vh] flex flex-col">
        <div class="flex-none flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">{t('docs.helpDialogTitle')}</h3>
          <button class="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        <div role="tablist" class="flex-none tabs tabs-bordered mb-4">
          {TABS.map(tab => (
            <a
              key={tab.id}
              role="tab"
              class={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {t(tab.labelKey)}
            </a>
          ))}
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto pr-2">
          {activeTab === 'about' && <DocView slug="about" />}
          {activeTab === 'tutorial' && <DocView slug="tutorial" />}
          {activeTab === 'examples' && <DocView slug="examples" />}
          {activeTab === 'downloads' && <DownloadsView />}
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
