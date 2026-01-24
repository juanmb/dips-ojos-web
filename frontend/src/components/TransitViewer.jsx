import { useEffect, useState, useCallback } from 'preact/hooks'
import { api } from '../api/client.js'
import { ClassificationForm } from './ClassificationForm.jsx'
import { TransitParameters } from './TransitParameters.jsx'
import { TransitNavigation } from './TransitNavigation.jsx'
import { DeleteClassificationsModal } from './modals/DeleteClassificationsModal.jsx'
import { t } from '../i18n/index.js'

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
      if (e.target.tagName === 'TEXTAREA') return
      if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        goToPrevious()
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        goToNext()
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
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

  if (!curve) {
    return (
      <div class="flex items-center justify-center h-full text-base-content/50">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>{t('transit.selectCurve')}</p>
          <p class="text-xs mt-2">{t('transit.shortcutsHint')}</p>
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
        <p>{t('transit.noTransits')}</p>
      </div>
    )
  }

  return (
    <div class="h-full flex flex-col">
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
              <div class="text-center text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p class="font-medium">{t('transit.noImage')}</p>
                <p class="text-sm mt-1 opacity-70">{t('transit.noImageReason')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div class="w-72 flex-none flex flex-col overflow-y-auto bg-base-100 border-l border-base-300">
          {/* Curve title */}
          <div class="flex-none px-3 py-2 border-b border-base-300">
            <h2 class="font-bold text-lg text-center">{t('curves.curve', { id: curve.id })}</h2>
          </div>

          <TransitNavigation
            currentIndex={currentIndex}
            total={transits.length}
            onPrev={goToPrevious}
            onNext={goToNext}
            onGoTo={goToTransit}
          />

          <TransitParameters curve={curve} transit={currentTransit} />

          {/* Classification form */}
          <div class="p-2 flex-1 flex flex-col">
            <ClassificationForm
              key={classificationKey}
              file={curve.filename}
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
                {t('classification.deleteAll')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <DeleteClassificationsModal
          curveId={curve.id}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteClassifications}
          deleting={deleting}
        />
      )}
    </div>
  )
}
