import { useState, useEffect, useCallback } from 'preact/hooks'
import Router, { route } from 'preact-router'
import { isAuthenticated, isAdmin, logout } from './stores/auth.js'
import { api } from './api/client.js'
import { Login } from './components/Login.jsx'
import { CurveList } from './components/CurveList.jsx'
import { TransitViewer } from './components/TransitViewer.jsx'
import { StatsPanel } from './components/StatsPanel.jsx'
import { AdminPanel } from './components/AdminPanel.jsx'
import { UserDetail } from './components/UserDetail.jsx'

function MainView({ curves, selectedCurve, setSelectedCurve, refreshKey, onClassificationSaved, navigateCurve }) {
  return (
    <div class="drawer lg:drawer-open flex-1 min-h-0">
      <input id="sidebar-drawer" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content flex flex-col overflow-hidden">
        <TransitViewer
          curve={selectedCurve}
          onClassificationSaved={onClassificationSaved}
          onNextCurve={() => navigateCurve('next')}
          onPrevCurve={() => navigateCurve('prev')}
        />
      </div>

      <div class="drawer-side z-40 h-full">
        <label for="sidebar-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <div class="w-80 h-full bg-base-100 flex flex-col overflow-hidden border-r border-base-300">
          <div class="flex-none p-2 border-b border-base-300">
            <StatsPanel refreshTrigger={refreshKey} />
          </div>

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
  )
}

function AdminView() {
  return (
    <div class="flex-1 min-h-0 overflow-hidden">
      <AdminPanel />
    </div>
  )
}

function UserDetailView({ id }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [id])

  const loadUser = async () => {
    try {
      setLoading(true)
      const users = await api.getUsers()
      const found = users.find(u => u.id === parseInt(id))
      setUser(found || null)
    } catch (err) {
      console.error('Failed to load user:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div class="flex-1 min-h-0 overflow-hidden flex justify-center items-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!user) {
    return (
      <div class="flex-1 min-h-0 overflow-hidden p-4">
        <div class="alert alert-error">User not found</div>
        <button class="btn btn-ghost mt-4" onClick={() => route('/admin')}>
          Back to Admin
        </button>
      </div>
    )
  }

  return (
    <div class="flex-1 min-h-0 overflow-hidden">
      <UserDetail user={user} />
    </div>
  )
}

export function App() {
  const [curves, setCurves] = useState([])
  const [selectedCurve, setSelectedCurve] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

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
    route('/')
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

  const handleRouteChange = (e) => {
    setCurrentPath(e.url)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
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

  const isAdminRoute = currentPath.startsWith('/admin')

  return (
    <div class="h-screen flex flex-col">
      {/* Fixed top navbar */}
      <div class="navbar bg-base-100 border-b border-base-300 flex-none">
        {/* Mobile menu toggle - only show on main view */}
        <div class="flex-none lg:hidden">
          {!isAdminRoute && (
            <label for="sidebar-drawer" class="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          )}
        </div>

        {/* Title - clickable to go home */}
        <div class="flex-1 pl-4">
          <a href="/" class="text-xl font-bold hover:opacity-80 transition-opacity">Dips OjOs</a>
        </div>

        {/* Right side: admin, help, logout */}
        <div class="flex-none flex items-center gap-1">
          {isAdmin.value && (
            <a
              href={isAdminRoute ? '/' : '/admin'}
              class={`btn btn-sm btn-ghost ${isAdminRoute ? 'btn-active' : ''}`}
              title={isAdminRoute ? 'Back to Classifier' : 'Admin Panel'}
            >
              {isAdminRoute ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span class="hidden sm:inline ml-1">Classifier</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="hidden sm:inline ml-1">Admin</span>
                </>
              )}
            </a>
          )}

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

      {/* Router content */}
      <Router onChange={handleRouteChange}>
        <MainView
          path="/"
          curves={curves}
          selectedCurve={selectedCurve}
          setSelectedCurve={setSelectedCurve}
          refreshKey={refreshKey}
          onClassificationSaved={handleClassificationSaved}
          navigateCurve={navigateCurve}
        />
        <AdminView path="/admin" />
        <UserDetailView path="/admin/users/:id" />
      </Router>

      <HelpDialog />
    </div>
  )
}
