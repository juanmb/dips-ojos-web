import { useState, useEffect, useRef } from 'preact/hooks'
import { api } from '../api/client.js'
import { t } from '../i18n/index.js'

export function ClassificationForm({ file, transitIndex, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [classification, setClassification] = useState({
    normal_transit: false,
    anomalous_morphology: false,
    left_asymmetry: false,
    right_asymmetry: false,
    increased_flux: false,
    decreased_flux: false,
    marked_tdv: false,
    bad_model_fit: false,
    notes: ''
  })

  const saveTimeoutRef = useRef(null)
  const lastLoadedRef = useRef({ file: null, transitIndex: null })

  useEffect(() => {
    loadClassification()
  }, [file, transitIndex])

  const loadClassification = async () => {
    if (!file || transitIndex === null) return

    // Only show loading spinner if we're loading a different transit
    const isNewTransit = lastLoadedRef.current.file !== file ||
                         lastLoadedRef.current.transitIndex !== transitIndex

    try {
      if (isNewTransit) {
        setLoading(true)
      }
      const data = await api.getClassification(file, transitIndex)
      lastLoadedRef.current = { file, transitIndex }
      if (data) {
        setClassification({
          normal_transit: data.normal_transit || false,
          anomalous_morphology: data.anomalous_morphology || false,
          left_asymmetry: data.left_asymmetry || false,
          right_asymmetry: data.right_asymmetry || false,
          increased_flux: data.increased_flux || false,
          decreased_flux: data.decreased_flux || false,
          marked_tdv: data.marked_tdv || false,
          bad_model_fit: data.bad_model_fit || false,
          notes: data.notes || ''
        })
      } else {
        setClassification({
          normal_transit: false,
          anomalous_morphology: false,
          left_asymmetry: false,
          right_asymmetry: false,
          increased_flux: false,
          decreased_flux: false,
          marked_tdv: false,
          bad_model_fit: false,
          notes: ''
        })
      }
    } catch (err) {
      console.error('Failed to load classification:', err)
    } finally {
      setLoading(false)
    }
  }

  const scheduleAutoSave = (newClassification) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveClassification(newClassification)
    }, 500)
  }

  const saveClassification = async (data) => {
    if (!file || transitIndex === null) return

    try {
      setSaving(true)
      await api.saveClassification(file, transitIndex, data)
      if (onSaved) onSaved()
    } catch (err) {
      console.error('Failed to save classification:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCheckboxChange = (field) => {
    const newClassification = {
      ...classification,
      [field]: !classification[field]
    }
    setClassification(newClassification)
    scheduleAutoSave(newClassification)
  }

  const handleNotesChange = (e) => {
    const newClassification = {
      ...classification,
      notes: e.target.value
    }
    setClassification(newClassification)
    scheduleAutoSave(newClassification)
  }

  if (loading) {
    return (
      <div class="flex justify-center p-4">
        <span class="loading loading-spinner loading-sm"></span>
      </div>
    )
  }

  const checkboxes = [
    { field: 'normal_transit', labelKey: 'classification.normalMorphology' },
    { field: 'anomalous_morphology', labelKey: 'classification.anomalousMorphology' },
    { field: 'left_asymmetry', labelKey: 'classification.leftAsymmetry' },
    { field: 'right_asymmetry', labelKey: 'classification.rightAsymmetry' },
    { field: 'increased_flux', labelKey: 'classification.interiorFluxIncrease' },
    { field: 'decreased_flux', labelKey: 'classification.interiorFluxDecrease' },
    { field: 'marked_tdv', labelKey: 'classification.markedTdv' },
    { field: 'bad_model_fit', labelKey: 'classification.badModelFit' }
  ]

  const isClassified = checkboxes.some(({ field }) => classification[field])

  return (
    <div class="card bg-base-200">
      <div class="card-body p-4">
        <h3 class="card-title text-sm flex items-center justify-between">
          <span class="flex items-center gap-2">
            {t('classification.title')}
            {saving && <span class="loading loading-spinner loading-xs"></span>}
          </span>
          <span class={`badge badge-sm ${isClassified ? 'badge-success' : 'badge-warning'}`}>
            {isClassified ? t('classification.classified') : t('classification.pending')}
          </span>
        </h3>

        <div class="grid grid-cols-1 gap-2">
          {checkboxes.map(({ field, labelKey }) => (
            <label key={field} class="label cursor-pointer justify-start gap-3 py-1">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary [--chkbg:theme(colors.primary)] transition-none"
                checked={classification[field]}
                onChange={() => handleCheckboxChange(field)}
              />
              <span class="label-text">{t(labelKey)}</span>
            </label>
          ))}
        </div>

        <div class="form-control mt-2">
          <label class="label py-1">
            <span class="label-text">{t('classification.notes')}</span>
          </label>
          <textarea
            class="textarea textarea-bordered textarea-sm h-20"
            placeholder={t('classification.notesPlaceholder')}
            value={classification.notes}
            onInput={handleNotesChange}
          ></textarea>
        </div>
      </div>
    </div>
  )
}
