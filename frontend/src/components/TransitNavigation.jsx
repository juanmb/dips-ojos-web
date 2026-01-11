import { t } from '../i18n/index.js'

export function TransitNavigation({ currentIndex, total, onPrev, onNext, onGoTo }) {
  return (
    <div class="flex-none px-3 py-2 border-b border-base-300 flex items-center justify-center gap-2">
      <button
        class="btn btn-sm btn-ghost"
        onClick={onPrev}
        disabled={currentIndex === 0}
        title={t('transit.prevTitle')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="join">
        <input
          type="number"
          class="input input-sm input-bordered join-item w-14 text-center"
          value={currentIndex + 1}
          min={1}
          max={total}
          onChange={(e) => onGoTo(parseInt(e.target.value, 10) - 1)}
        />
        <span class="btn btn-sm btn-ghost join-item no-animation px-2">
          / {total}
        </span>
      </div>

      <button
        class="btn btn-sm btn-ghost"
        onClick={onNext}
        disabled={currentIndex === total - 1}
        title={t('transit.nextTitle')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
