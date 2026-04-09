// Defaults to Vite proxy (/api), but can target a deployed backend when configured.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

// Stable anonymous user_id stored in localStorage
function getAnonymousUserId() {
  let id = localStorage.getItem('pm_user_id')
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem('pm_user_id', id)
  }
  return id
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const raw = await response.text()
  let data = null

  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = { message: raw }
    }
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Request failed with status ${response.status}`)
  }

  return data
}

/**
 * POST /api/generate
 * @param {string} query
 * @returns {Promise<{type: string, content: any, status: string}>}
 */
export async function generateResponse(query) {
  return request('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      user_id: getAnonymousUserId(),
    }),
  })
}

/**
 * GET /api/health
 */
export async function getBackendHealth() {
  return request('/health')
}

/**
 * GET /api/history/public
 */
export async function getPublicHistory(limit = 8) {
  const userId = getAnonymousUserId()
  const params = new URLSearchParams({
    user_id: userId,
    limit: String(limit),
  })

  return request(`/history/public?${params.toString()}`)
}

export { getAnonymousUserId }
