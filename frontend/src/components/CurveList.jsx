import { useState, useRef } from 'preact/hooks'
import { t } from '../i18n/index.js'

export function CurveList({ curves = [], selectedCurve, onSelectCurve }) {
  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const allListRef = useRef(null)
  const pendingListRef = useRef(null)
  const completedListRef = useRef(null)

  const getCurveName = (curve) => t('curves.curve', { id: curve.id })

  const isCompleted = (curve) => {
    const total = curve.found_transits || 0
    const classified = curve.classified_count || 0
    return total > 0 && classified >= total
  }

  const filteredCurves = curves
    .filter(curve => getCurveName(curve).toLowerCase().includes(filter.toLowerCase()))

  const allCurves = filteredCurves

  const pendingCurves = filteredCurves
    .filter(curve => !isCompleted(curve))

  const completedCurves = filteredCurves
    .filter(curve => isCompleted(curve))

  const allCount = curves.length
  const pendingCount = curves.filter(c => !isCompleted(c)).length
  const completedCount = curves.filter(c => isCompleted(c)).length

  const renderCurveList = (curveList, listRef) => (
    <div class="flex-1 overflow-y-auto" ref={listRef}>
      <ul class="menu menu-sm p-2">
        {curveList.map(curve => {
          const total = curve.found_transits || 0
          const classified = curve.classified_count || 0
          const progress = total > 0 ? Math.round((classified / total) * 100) : 0
          const isSelected = selectedCurve?.id === curve.id

          return (
            <li key={curve.id}>
              <a
                class={`flex items-center gap-2 py-2 ${isSelected ? 'bg-primary/20 font-semibold' : ''}`}
                onClick={() => onSelectCurve(curve)}
              >
                <span class="font-medium whitespace-nowrap flex-1">
                  {getCurveName(curve)}
                </span>
                <progress
                  class="progress progress-success w-20 h-2"
                  value={progress}
                  max="100"
                ></progress>
                <span class="text-xs opacity-70 whitespace-nowrap w-10 text-right">
                  {classified}/{total || '?'}
                </span>
              </a>
            </li>
          )
        })}
        {curveList.length === 0 && (
          <li class="text-center text-sm opacity-50 py-4">
            {t('curves.noCurves')}
          </li>
        )}
      </ul>
    </div>
  )

  return (
    <div class="h-full flex flex-col">
      {/* Fixed header */}
      <div class="flex-none p-2 border-b border-base-300">
        <input
          type="text"
          placeholder={t('curves.filter')}
          class="input input-bordered input-sm w-full"
          value={filter}
          onInput={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Fixed tabs */}
      <div class="flex-none border-b border-base-300">
        <div class="tabs tabs-boxed bg-transparent p-1">
          <a
            class={`tab tab-sm flex-1 flex-col h-auto py-1 ${activeTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>{t('curves.all')}</span>
            <span class="text-xs opacity-70">({allCount})</span>
          </a>
          <a
            class={`tab tab-sm flex-1 flex-col h-auto py-1 ${activeTab === 'pending' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span>{t('curves.pending')}</span>
            <span class="text-xs opacity-70">({pendingCount})</span>
          </a>
          <a
            class={`tab tab-sm flex-1 flex-col h-auto py-1 ${activeTab === 'completed' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <span>{t('curves.done')}</span>
            <span class="text-xs opacity-70">({completedCount})</span>
          </a>
        </div>
      </div>

      {/* Scrollable curve lists - all rendered, two hidden */}
      <div class={`flex-1 overflow-hidden flex flex-col ${activeTab !== 'all' ? 'hidden' : ''}`}>
        {renderCurveList(allCurves, allListRef)}
        <div class="flex-none p-2 border-t border-base-300 text-xs opacity-70">
          {t('curves.curvesCount', { count: allCurves.length })}
        </div>
      </div>

      <div class={`flex-1 overflow-hidden flex flex-col ${activeTab !== 'pending' ? 'hidden' : ''}`}>
        {renderCurveList(pendingCurves, pendingListRef)}
        <div class="flex-none p-2 border-t border-base-300 text-xs opacity-70">
          {t('curves.curvesCount', { count: pendingCurves.length })}
        </div>
      </div>

      <div class={`flex-1 overflow-hidden flex flex-col ${activeTab !== 'completed' ? 'hidden' : ''}`}>
        {renderCurveList(completedCurves, completedListRef)}
        <div class="flex-none p-2 border-t border-base-300 text-xs opacity-70">
          {t('curves.curvesCount', { count: completedCurves.length })}
        </div>
      </div>
    </div>
  )
}
