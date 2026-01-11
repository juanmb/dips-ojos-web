import { useEffect, useState } from 'preact/hooks'
import { api } from '../api/client.js'

export function UserDetail({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadStats()
  }, [user.id])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.getUserStats(user.id)
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      await api.exportUserClassifications(user.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const progressPercent = stats
    ? Math.round((stats.classified_transits / stats.total_transits) * 100) || 0
    : 0

  const curvesPercent = stats
    ? Math.round((stats.curves_completed / stats.total_curves) * 100) || 0
    : 0

  return (
    <div class="p-4 h-full overflow-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">{user.fullname}</h1>
          <p class="text-sm opacity-70">@{user.username}</p>
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={exporting || !stats?.classified_transits}
          >
            {exporting ? (
              <span class="loading loading-spinner loading-sm"></span>
            ) : (
              'Export CSV'
            )}
          </button>
          <a href="/admin" class="btn btn-ghost btn-sm">
            Back
          </a>
        </div>
      </div>

      {error && (
        <div class="alert alert-error mb-4">
          <span>{error}</span>
          <button class="btn btn-ghost btn-xs" onClick={() => setError(null)}>X</button>
        </div>
      )}

      {loading ? (
        <div class="flex justify-center p-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      ) : stats ? (
        <div class="space-y-6">
          {/* Admin badge */}
          {user.is_admin && (
            <div class="badge badge-primary">Administrator</div>
          )}

          {/* Progress cards */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transits progress */}
            <div class="card bg-base-200">
              <div class="card-body">
                <h2 class="card-title text-base">Transits Classified</h2>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-bold">{stats.classified_transits}</span>
                  <span class="text-sm opacity-70">/ {stats.total_transits}</span>
                </div>
                <progress
                  class="progress progress-primary w-full"
                  value={progressPercent}
                  max="100"
                ></progress>
                <p class="text-sm opacity-70">{progressPercent}% complete</p>
              </div>
            </div>

            {/* Curves progress */}
            <div class="card bg-base-200">
              <div class="card-body">
                <h2 class="card-title text-base">Curves Completed</h2>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-bold">{stats.curves_completed}</span>
                  <span class="text-sm opacity-70">/ {stats.total_curves}</span>
                </div>
                <progress
                  class="progress progress-secondary w-full"
                  value={curvesPercent}
                  max="100"
                ></progress>
                <p class="text-sm opacity-70">
                  {stats.curves_with_progress} curves with progress
                </p>
              </div>
            </div>
          </div>

          {/* Classification breakdown */}
          <div class="card bg-base-200">
            <div class="card-body">
              <h2 class="card-title text-base mb-4">Classification Breakdown</h2>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th class="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Normal Morphology</td>
                      <td class="text-right font-mono">{stats.transito_normal}</td>
                    </tr>
                    <tr>
                      <td>Anomalous Morphology</td>
                      <td class="text-right font-mono">{stats.morfologia_anomala}</td>
                    </tr>
                    <tr>
                      <td>Left Asymmetry</td>
                      <td class="text-right font-mono">{stats.asimetria_izquierda}</td>
                    </tr>
                    <tr>
                      <td>Right Asymmetry</td>
                      <td class="text-right font-mono">{stats.asimetria_derecha}</td>
                    </tr>
                    <tr>
                      <td>Interior Flux Increase</td>
                      <td class="text-right font-mono">{stats.aumento_flujo}</td>
                    </tr>
                    <tr>
                      <td>Interior Flux Decrease</td>
                      <td class="text-right font-mono">{stats.disminucion_flujo}</td>
                    </tr>
                    <tr>
                      <td>Marked TDV</td>
                      <td class="text-right font-mono">{stats.tdv_marcada}</td>
                    </tr>
                    <tr>
                      <td>Has Notes</td>
                      <td class="text-right font-mono">{stats.with_notes}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Last activity */}
          {stats.last_activity && (
            <div class="text-sm opacity-70">
              Last activity: {new Date(stats.last_activity).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div class="text-center opacity-70 p-8">No statistics available</div>
      )}
    </div>
  )
}
