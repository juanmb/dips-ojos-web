import { useEffect, useState, useCallback } from 'preact/hooks'
import { api } from '../api/client.js'
import { ClassificationForm } from './ClassificationForm.jsx'

export function TransitViewer({ curve, onClassificationSaved, onNextCurve, onPrevCurve }) {
  const [transits, setTransits] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTransit, setCurrentTransit] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [classificationKey, setClassificationKey] = useState(0)

  useEffect(() => {
    if (curve) {
      loadTransits()
    }
  }, [curve])

  useEffect(() => {
    if (transits.length > 0 && currentIndex >= 0 && currentIndex < transits.length) {
      setCurrentTransit(transits[currentIndex])
    }
  }, [transits, currentIndex])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const goToNext = useCallback(() => {
    if (currentIndex < transits.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, transits.length])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore text inputs but allow checkboxes
      if (e.target.tagName === 'TEXTAREA') return
      if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return

      // Transit navigation
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        goToPrevious()
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        goToNext()
      }
      // Curve navigation
      else if (e.key === 'ArrowUp' || e.key === 'w') {
        onPrevCurve?.()
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        onNextCurve?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [transits.length, currentIndex, goToPrevious, goToNext, onNextCurve, onPrevCurve])

  const loadTransits = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getCurveTransits(curve.id)
      setTransits(data || [])
      setCurrentIndex(0)
    } catch (err) {
      setError(err.message)
      setTransits([])
    } finally {
      setLoading(false)
    }
  }

  const goToTransit = (index) => {
    if (index >= 0 && index < transits.length) {
      setCurrentIndex(index)
    }
  }

  const handleDeleteClassifications = async () => {
    try {
      setDeleting(true)
      await api.deleteCurveClassifications(curve.id)
      setShowDeleteDialog(false)
      setClassificationKey(k => k + 1)
      if (onClassificationSaved) onClassificationSaved()
    } catch (err) {
      console.error('Failed to delete classifications:', err)
    } finally {
      setDeleting(false)
    }
  }

  const DeleteConfirmDialog = () => (
    <dialog class={`modal ${showDeleteDialog ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">Delete All Classifications</h3>
        <div class="py-4">
          <div class="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>This action cannot be undone!</span>
          </div>
          <p>Are you sure you want to delete all your classifications for <strong>Curve {curve?.id}</strong>?</p>
          <p class="text-sm opacity-70 mt-2">This will remove all transit classifications you have made for this curve.</p>
        </div>
        <div class="modal-action">
          <button
            class="btn btn-ghost"
            onClick={() => setShowDeleteDialog(false)}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            class={`btn btn-error ${deleting ? 'loading' : ''}`}
            onClick={handleDeleteClassifications}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button onClick={() => setShowDeleteDialog(false)}>close</button>
      </form>
    </dialog>
  )

  if (!curve) {
    return (
      <div class="flex items-center justify-center h-full text-base-content/50">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Select a curve to view transits</p>
          <p class="text-xs mt-2">Press <kbd class="kbd kbd-xs">?</kbd> for keyboard shortcuts</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div class="flex items-center justify-center h-full">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div class="flex items-center justify-center h-full">
        <div class="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (transits.length === 0) {
    return (
      <div class="flex items-center justify-center h-full text-base-content/50">
        <p>No transits found for this curve</p>
      </div>
    )
  }

  return (
    <div class="h-full flex flex-col">
      {/* Main content */}
      <div class="flex-1 flex overflow-hidden min-h-0">
        {/* Transit image */}
        <div class="flex-1 flex flex-col min-w-0 min-h-0 bg-base-300">
          <div class="flex-1 flex items-center justify-center p-4 pb-8 min-h-0">
            {currentTransit?.plot_file ? (
              <img
                src={`/plots/${currentTransit.plot_file}`}
                alt={`Transit ${currentIndex + 1}`}
                class="max-w-full max-h-full object-contain dark-invert"
              />
            ) : (
              <div class="text-base-content/50">No image available</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div class="w-72 flex-none flex flex-col overflow-y-auto bg-base-100 border-l border-base-300">
          {/* Curve title */}
          <div class="flex-none px-3 py-2 border-b border-base-300">
            <h2 class="font-bold text-lg text-center">Curve {curve.id}</h2>
          </div>

          {/* Navigation controls */}
          <div class="flex-none px-3 py-2 border-b border-base-300 flex items-center justify-center gap-2">
            <button
              class="btn btn-sm btn-ghost"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              title="Previous transit (← or A)"
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
                max={transits.length}
                onChange={(e) => goToTransit(parseInt(e.target.value, 10) - 1)}
              />
              <span class="btn btn-sm btn-ghost join-item no-animation px-2">
                / {transits.length}
              </span>
            </div>

            <button
              class="btn btn-sm btn-ghost"
              onClick={goToNext}
              disabled={currentIndex === transits.length - 1}
              title="Next transit (→ or D)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Transit parameters */}
          {currentTransit && (
            <div class="card bg-base-200 mx-2 mt-2">
              <div class="card-body p-2">
                <h3 class="card-title text-sm mb-1">Transit Parameters</h3>

                {/* Rp/R* */}
                <div class="mb-1">
                  <div class="text-xs opacity-70">Radius (Rp/R*)</div>
                  <div class="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span class="opacity-60">Theo:</span>
                      <span class="font-mono ml-1">{curve?.radio_planeta_r_star?.toFixed(6) || '-'}</span>
                    </div>
                    <div>
                      <span class="opacity-60">Fitted:</span>
                      <span class="font-mono ml-1">{currentTransit.rp_fitted?.toFixed(6) || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* a/R* */}
                <div>
                  <div class="text-xs opacity-70">Semi-axis (a/R*)</div>
                  <div class="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span class="opacity-60">Theo:</span>
                      <span class="font-mono ml-1">{curve?.semieje_a_r_star?.toFixed(4) || '-'}</span>
                    </div>
                    <div>
                      <span class="opacity-60">Fitted:</span>
                      <span class="font-mono ml-1">{currentTransit.a_fitted?.toFixed(4) || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible other parameters */}
                <div class="collapse mt-2 -mx-2">
                  <input type="checkbox" class="min-h-0 p-0" />
                  <div class="collapse-title min-h-0 p-0 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50 transition-transform [[data-open]_&]:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div class="collapse-content px-2">
                    <div class="grid grid-cols-2 gap-1 text-xs pt-1">
                      <div>
                        <div class="opacity-70">T0 Expected</div>
                        <div class="font-mono">{currentTransit.t0_expected?.toFixed(5) || '-'}</div>
                      </div>
                      <div>
                        <div class="opacity-70">T0 Fitted</div>
                        <div class="font-mono">{currentTransit.t0_fitted?.toFixed(5) || '-'}</div>
                      </div>
                      <div>
                        <div class="opacity-70">TTV (min)</div>
                        <div class={`font-mono ${Math.abs(currentTransit.ttv_minutes || 0) > 5 ? 'text-warning' : ''}`}>
                          {currentTransit.ttv_minutes?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div class="opacity-70">RMS</div>
                        <div class="font-mono">{currentTransit.rms_residuals?.toFixed(6) || '-'}</div>
                      </div>
                      <div>
                        <div class="opacity-70">Period (d)</div>
                        <div class="font-mono">{currentTransit.period?.toFixed(6) || '-'}</div>
                      </div>
                      <div>
                        <div class="opacity-70">Inc (deg)</div>
                        <div class="font-mono">{currentTransit.inc?.toFixed(2) || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classification form */}
          <div class="p-2 flex-1 flex flex-col">
            <ClassificationForm
              key={classificationKey}
              file={curve.nombre_archivo}
              transitIndex={currentTransit?.transit_index ?? currentIndex}
              onSaved={onClassificationSaved}
            />

            {/* Delete all classifications button */}
            <div class="mt-auto pt-2">
              <button
                class="btn btn-outline btn-error btn-sm w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Classifications
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog />
    </div>
  )
}
