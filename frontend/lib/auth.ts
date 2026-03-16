export type Role = 'owner' | 'worker' | null

const isBrowser = typeof window !== 'undefined'
const ROLE_KEY = 'role'
const SHOP_ID_KEY = 'notable_shop_id'
const SHOP_NAME_KEY = 'notable_shop_name'
const OWNER_SESSION_KEY = 'owner_session_active'
const WORKER_PROFILE_KEY = 'notable_worker_profile'

export function setShopContext(id: number, name: string) {
  if (!isBrowser) return
  window.localStorage.setItem(SHOP_ID_KEY, id.toString())
  window.localStorage.setItem(SHOP_NAME_KEY, name)
}

export function getShopContext() {
  if (!isBrowser) return { id: null, name: null }
  return {
    id: window.localStorage.getItem(SHOP_ID_KEY),
    name: window.localStorage.getItem(SHOP_NAME_KEY)
  }
}

export function getShopName(): string | null {
  if (!isBrowser) return null
  return window.localStorage.getItem(SHOP_NAME_KEY)
}

export function clearAuth() {
  if (!isBrowser) return
  window.localStorage.removeItem(SHOP_ID_KEY)
  window.localStorage.removeItem(SHOP_NAME_KEY)
  window.localStorage.removeItem(ROLE_KEY)
  window.localStorage.removeItem(WORKER_PROFILE_KEY)
  window.sessionStorage.removeItem(OWNER_SESSION_KEY)
}

export function setWorkerProfile(name: string) {
  if (!isBrowser) return
  window.localStorage.setItem(WORKER_PROFILE_KEY, name)
}

export function getWorkerProfile(): string | null {
  if (!isBrowser) return null
  return window.localStorage.getItem(WORKER_PROFILE_KEY)
}

export function clearWorkerProfile() {
  if (!isBrowser) return
  window.localStorage.removeItem(WORKER_PROFILE_KEY)
}

export function setOwnerSession(active: boolean) {
  if (!isBrowser) return
  if (active) {
    window.sessionStorage.setItem(OWNER_SESSION_KEY, 'true')
  } else {
    window.sessionStorage.removeItem(OWNER_SESSION_KEY)
  }
}

export function isOwnerSessionValid(): boolean {
  if (!isBrowser) return false
  return window.sessionStorage.getItem(OWNER_SESSION_KEY) === 'true'
}

export function getRole(): Role {
  if (!isBrowser) return null
  // No shop session means not authenticated — always return null
  const shopId = window.localStorage.getItem(SHOP_ID_KEY)
  if (!shopId) return null
  if (isOwnerSessionValid()) return 'owner'
  try {
    const raw = window.localStorage.getItem(ROLE_KEY)
    return raw ? (JSON.parse(raw) as Role) : 'worker'
  } catch {
    return 'worker'
  }
}

export function setRole(role: Role) {
  if (!isBrowser) return
  try {
    if (role === 'owner') {
      setOwnerSession(true)
    } else if (role === 'worker') {
      setOwnerSession(false)
      window.localStorage.setItem(ROLE_KEY, JSON.stringify('worker'))
    } else {
      window.localStorage.removeItem(ROLE_KEY)
      setOwnerSession(false)
    }
  } catch { }
}

export function isOwner(): boolean {
  return getRole() === 'owner'
}
