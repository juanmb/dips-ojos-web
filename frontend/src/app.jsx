import { useState, useEffect, useCallback } from 'preact/hooks'
import Router, { route } from 'preact-router'
import { isAuthenticated, isAdmin, logout } from './stores/auth.js'
import { api } from './api/client.js'
import { t } from './i18n/index.js'
import { Login } from './components/Login.jsx'
import { CurveList } from './components/CurveList.jsx'
import { TransitViewer } from './components/TransitViewer.jsx'
import { StatsPanel } from './components/StatsPanel.jsx'
import { AdminPanel } from './components/AdminPanel.jsx'
import { UserDetail } from './components/UserDetail.jsx'
import { Navbar } from './components/layout/Navbar.jsx'
import { HelpDialog } from './components/layout/HelpDialog.jsx'

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
        <div class="alert alert-error">{t('admin.userNotFound')}</div>
        <button class="btn btn-ghost mt-4" onClick={() => route('/admin')}>
          {t('admin.backToAdmin')}
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

  const isAdminRoute = currentPath.startsWith('/admin')

  return (
    <div class="h-screen flex flex-col">
      <Navbar
        isAdminRoute={isAdminRoute}
        onLogout={handleLogout}
        onShowHelp={() => setShowHelp(true)}
      />

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

      <HelpDialog show={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}
