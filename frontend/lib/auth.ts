export type Role = 'owner' | 'worker' | null

const isBrowser = typeof window !== 'undefined'
const ROLE_KEY = 'role'

export function getRole(): Role {
  if (!isBrowser) return null
  try {
    const raw = window.localStorage.getItem(ROLE_KEY)
    return raw ? (JSON.parse(raw) as Role) : null
  } catch {
    return null
  }
}

export function setRole(role: Role) {
  if (!isBrowser) return
  try {
    if (role === null) {
      window.localStorage.removeItem(ROLE_KEY)
    } else {
      window.localStorage.setItem(ROLE_KEY, JSON.stringify(role))
    }
  } catch {}
}

export function isOwner(): boolean {
  return getRole() === 'owner'
}

export function verifyOwnerPin(pin: string): boolean {
  const expected = process.env.NEXT_PUBLIC_OWNER_PIN || '1234'
  return pin === expected
}
