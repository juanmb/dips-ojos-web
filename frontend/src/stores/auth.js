import { signal, computed } from '@preact/signals'

const TOKEN_KEY = 'emoons_token'
const USER_KEY = 'emoons_user'

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null
    }
  } catch {
    return { token: null, user: null }
  }
}

const stored = loadFromStorage()

export const token = signal(stored.token)
export const user = signal(stored.user)
export const isAuthenticated = computed(() => !!token.value)

export function setAuth(newToken, newUser) {
  token.value = newToken
  user.value = newUser

  if (newToken && newUser) {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export function logout() {
  setAuth(null, null)
}
