import { isAdmin } from '../../stores/auth.js'
import { t, language, setLanguage } from '../../i18n/index.js'

export function Navbar({ isAdminRoute, onLogout, onShowHelp }) {
  return (
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

      {/* Right side: language, admin, help, logout */}
      <div class="flex-none flex items-center gap-1">
        {/* Language selector */}
        <div class="dropdown dropdown-end">
          <label tabIndex={0} class="btn btn-sm btn-ghost">
            {language.value.toUpperCase()}
          </label>
          <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-32">
            <li><a onClick={() => setLanguage('en')} class={language.value === 'en' ? 'active' : ''}>{t('language.en')}</a></li>
            <li><a onClick={() => setLanguage('es')} class={language.value === 'es' ? 'active' : ''}>{t('language.es')}</a></li>
          </ul>
        </div>

        {isAdmin.value && (
          <a
            href={isAdminRoute ? '/' : '/admin'}
            class={`btn btn-sm btn-ghost ${isAdminRoute ? 'btn-active' : ''}`}
            title={isAdminRoute ? t('navbar.classifier') : t('navbar.admin')}
          >
            {isAdminRoute ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span class="hidden sm:inline ml-1">{t('navbar.classifier')}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span class="hidden sm:inline ml-1">{t('navbar.admin')}</span>
              </>
            )}
          </a>
        )}

        <button
          class="btn btn-sm btn-ghost btn-circle"
          onClick={onShowHelp}
          title={t('navbar.help')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          class="btn btn-sm btn-ghost btn-circle"
          onClick={onLogout}
          title={t('navbar.logout')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}
