import { useEffect, useState } from 'preact/hooks'
import { api } from '../api/client.js'

export function StatsPanel({ refreshTrigger }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      const data = await api.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div class="stats shadow bg-base-200 w-full">
        <div class="stat p-2">
          <div class="stat-title text-xs">Loading...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div class="stats shadow bg-base-200 w-full">
      <div class="stat p-2 px-3">
        <div class="stat-title text-xs">Classified transits</div>
        <div class="stat-value text-base">{stats.total_classified || 0}</div>
      </div>
      <div class="stat p-2 px-3">
        <div class="stat-title text-xs">Curves done</div>
        <div class="stat-value text-base">{stats.curves_completed || 0}</div>
      </div>
    </div>
  )
}
