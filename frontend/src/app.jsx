import { useState, useEffect, useCallback } from 'preact/hooks'
import { isAuthenticated, logout } from './stores/auth.js'
import { api } from './api/client.js'
import { Login } from './components/Login.jsx'
import { CurveList } from './components/CurveList.jsx'
import { TransitViewer } from './components/TransitViewer.jsx'
import { StatsPanel } from './components/StatsPanel.jsx'

export function App() {
  const [curves, setCurves] = useState([])
  const [selectedCurve, setSelectedCurve] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (isAuthenticated.value) {
      loadCurves()
    }
  }, [isAuthenticated.value])

  const loadCurves = async () => {
    try {
      const data = await api.getCurves()
      const sorted = (data || []).sort((a, b) => a.id - b.id)
      setCurves(sorted)
    } catch (err) {
      console.error('Failed to load curves:', err)
    }
  }

  if (!isAuthenticated.value) {
    return <Login />
  }

  const handleClassificationSaved = () => {
    setRefreshKey(k => k + 1)
    loadCurves()
  }

  const handleLogout = () => {
    logout()
    setSelectedCurve(null)
  }

  const navigateCurve = useCallback((direction) => {
    if (!curves.length) return

    const currentIndex = selectedCurve
      ? curves.findIndex(c => c.id === selectedCurve.id)
      : -1

    let newIndex
    if (direction === 'next') {
      newIndex = currentIndex < curves.length - 1 ? currentIndex + 1 : currentIndex
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : 0
    }

    if (newIndex !== currentIndex && curves[newIndex]) {
      setSelectedCurve(curves[newIndex])
    }
  }, [curves, selectedCurve])

  // Keyboard shortcut for help (global)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore text inputs but allow checkboxes
      if (e.target.tagName === 'TEXTAREA') return
      if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return
      if (e.key === '?' || e.key === 'h') {
        setShowHelp(s => !s)
      } else if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  const HelpDialog = () => (
    <dialog class={`modal ${showHelp ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Keyboard Shortcuts</h3>

        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-sm opacity-70 mb-2">Transit Navigation</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><kbd class="kbd kbd-sm">←</kbd> or <kbd class="kbd kbd-sm">A</kbd></div>
              <div>Previous transit</div>
              <div><kbd class="kbd kbd-sm">→</kbd> or <kbd class="kbd kbd-sm">D</kbd></div>
              <div>Next transit</div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-sm opacity-70 mb-2">Curve Navigation</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><kbd class="kbd kbd-sm">↑</kbd> or <kbd class="kbd kbd-sm">W</kbd></div>
              <div>Previous curve</div>
              <div><kbd class="kbd kbd-sm">↓</kbd> or <kbd class="kbd kbd-sm">S</kbd></div>
              <div>Next curve</div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-sm opacity-70 mb-2">General</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><kbd class="kbd kbd-sm">?</kbd> or <kbd class="kbd kbd-sm">H</kbd></div>
              <div>Toggle help</div>
              <div><kbd class="kbd kbd-sm">Esc</kbd></div>
              <div>Close dialog</div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-sm" onClick={() => setShowHelp(false)}>Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button onClick={() => setShowHelp(false)}>close</button>
      </form>
    </dialog>
  )

  return (
    <div class="h-screen flex flex-col">
      {/* Fixed top navbar */}
      <div class="navbar bg-base-100 border-b border-base-300 flex-none">
        {/* Mobile menu toggle */}
        <div class="flex-none lg:hidden">
          <label for="sidebar-drawer" class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>

        {/* Title */}
        <div class="flex-1 pl-4">
          <span class="text-xl font-bold">Dips OjOs</span>
        </div>

        {/* Right side: theme, help, logout */}
        <div class="flex-none flex items-center gap-1">
          <button
            class="btn btn-sm btn-ghost btn-circle"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            class="btn btn-sm btn-ghost btn-circle"
            onClick={() => setShowHelp(true)}
            title="Keyboard shortcuts (?)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            class="btn btn-sm btn-ghost btn-circle"
            onClick={handleLogout}
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content with drawer */}
      <div class="drawer lg:drawer-open flex-1 min-h-0">
        <input id="sidebar-drawer" type="checkbox" class="drawer-toggle" />

        {/* Main content */}
        <div class="drawer-content flex flex-col overflow-hidden">
          <TransitViewer
            curve={selectedCurve}
            onClassificationSaved={handleClassificationSaved}
            onNextCurve={() => navigateCurve('next')}
            onPrevCurve={() => navigateCurve('prev')}
          />
        </div>

        {/* Sidebar */}
        <div class="drawer-side z-40 h-full">
          <label for="sidebar-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
          <div class="w-80 h-full bg-base-100 flex flex-col overflow-hidden border-r border-base-300">
            {/* Stats - fixed */}
            <div class="flex-none p-2 border-b border-base-300">
              <StatsPanel refreshTrigger={refreshKey} />
            </div>

            {/* Curve list - scrollable */}
            <div class="flex-1 min-h-0 overflow-hidden">
              <CurveList
                curves={curves}
                selectedCurve={selectedCurve}
                onSelectCurve={setSelectedCurve}
              />
            </div>
          </div>
        </div>
      </div>

      <HelpDialog />
    </div>
  )
}
