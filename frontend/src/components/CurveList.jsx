import { useState, useRef } from 'preact/hooks'

export function CurveList({ curves = [], selectedCurve, onSelectCurve }) {
  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  const pendingListRef = useRef(null)
  const completedListRef = useRef(null)

  const getCurveName = (curve) => `Curve ${curve.id}`

  const isCompleted = (curve) => {
    const total = curve.num_expected_transits || 0
    const classified = curve.classified_count || 0
    return total > 0 && classified >= total
  }

  const pendingCurves = curves
    .filter(curve => getCurveName(curve).toLowerCase().includes(filter.toLowerCase()))
    .filter(curve => !isCompleted(curve))

  const completedCurves = curves
    .filter(curve => getCurveName(curve).toLowerCase().includes(filter.toLowerCase()))
    .filter(curve => isCompleted(curve))

  const pendingCount = curves.filter(c => !isCompleted(c)).length
  const completedCount = curves.filter(c => isCompleted(c)).length

  const renderCurveList = (curveList, listRef) => (
    <div class="flex-1 overflow-y-auto" ref={listRef}>
      <ul class="menu menu-sm p-2">
        {curveList.map(curve => {
          const total = curve.num_expected_transits || 0
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
            No curves found
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
          placeholder="Filter curves..."
          class="input input-bordered input-sm w-full"
          value={filter}
          onInput={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Fixed tabs */}
      <div class="flex-none border-b border-base-300">
        <div class="tabs tabs-boxed bg-transparent p-1">
          <a
            class={`tab tab-sm flex-1 ${activeTab === 'pending' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingCount})
          </a>
          <a
            class={`tab tab-sm flex-1 ${activeTab === 'completed' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Done ({completedCount})
          </a>
        </div>
      </div>

      {/* Scrollable curve lists - both rendered, one hidden */}
      <div class={`flex-1 overflow-hidden flex flex-col ${activeTab !== 'pending' ? 'hidden' : ''}`}>
        {renderCurveList(pendingCurves, pendingListRef)}
        <div class="flex-none p-2 border-t border-base-300 text-xs opacity-70">
          {pendingCurves.length} curves
        </div>
      </div>

      <div class={`flex-1 overflow-hidden flex flex-col ${activeTab !== 'completed' ? 'hidden' : ''}`}>
        {renderCurveList(completedCurves, completedListRef)}
        <div class="flex-none p-2 border-t border-base-300 text-xs opacity-70">
          {completedCurves.length} curves
        </div>
      </div>
    </div>
  )
}
