import { useState } from 'preact/hooks'
import { api } from '../api/client.js'
import { t } from '../i18n/index.js'

export function DownloadDatabaseButton({ onError }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await api.downloadDatabase()
    } catch (err) {
      onError?.(err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      class="btn btn-outline btn-sm"
      disabled={downloading}
      onClick={handleDownload}
    >
      {downloading ? <span class="loading loading-spinner loading-xs"></span> : null}
      {t('admin.downloadDb')}
    </button>
  )
}
