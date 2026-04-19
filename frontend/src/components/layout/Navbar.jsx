import { Menu, ChevronsLeft, Users, Keyboard, HelpCircle, LogOut } from 'lucide-preact'
import { isAdmin } from '../../stores/auth.js'
import { t, language, setLanguage } from '../../i18n/index.js'

export function Navbar({ isAdminRoute, onLogout, onShowHelp, onShowShortcuts }) {
  return (
    <div class="navbar bg-base-100 border-b border-base-300 flex-none">
      {/* Mobile menu toggle - only show on main view */}
      <div class="flex-none lg:hidden">
        {!isAdminRoute && (
          <label for="sidebar-drawer" class="btn btn-square btn-ghost">
            <Menu class="h-5 w-5" />
          </label>
        )}
      </div>

      {/* Title - clickable to go home */}
      <div class="flex-1 pl-4">
        <a href="/" class="text-xl font-bold hover:opacity-80 transition-opacity">Dips OjOs</a>
      </div>

      {/* Right side: language, shortcuts, help, admin, logout */}
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

        <button
          class="btn btn-sm btn-ghost btn-circle"
          onClick={onShowShortcuts}
          title={t('navbar.shortcuts')}
        >
          <Keyboard class="h-5 w-5" />
        </button>

        <button
          class="btn btn-sm btn-circle btn-primary"
          onClick={onShowHelp}
          title={t('navbar.help')}
        >
          <HelpCircle class="h-5 w-5" strokeWidth={2.5} />
        </button>

        {isAdmin.value && (
          <a
            href={isAdminRoute ? '/' : '/admin'}
            class={`btn btn-sm btn-ghost ${isAdminRoute ? 'btn-active' : ''}`}
            title={isAdminRoute ? t('navbar.classifier') : t('navbar.admin')}
          >
            {isAdminRoute ? (
              <>
                <ChevronsLeft class="h-5 w-5" />
                <span class="hidden sm:inline ml-1">{t('navbar.classifier')}</span>
              </>
            ) : (
              <>
                <Users class="h-5 w-5" />
                <span class="hidden sm:inline ml-1">{t('navbar.admin')}</span>
              </>
            )}
          </a>
        )}

        <button
          class="btn btn-sm btn-ghost btn-circle"
          onClick={onLogout}
          title={t('navbar.logout')}
        >
          <LogOut class="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
