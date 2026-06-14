const jwt = require('jsonwebtoken')
const AUTH_URL = (process.env.BETTER_AUTH_URL || 'http://localhost:3000').replace(/\/$/, '')

async function resolveSession(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'qR3fG8jK2mL5nP9sT4vW7xZ1yC6vB3nN')
      if (decoded && decoded.id) {
        return {
          user: decoded,
          session: {
            token: token,
            userId: decoded.id
          }
        }
      }
    } catch (err) {
      console.warn('JWT stateless verification failed:', err.message)
    }
  }

  const headers = {}
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization
  }
  if (req.headers.cookie) {
    headers.cookie = req.headers.cookie
  }

  try {
    const response = await fetch(`${AUTH_URL}/api/auth/get-session`, { headers })
    if (!response.ok) return null
    const data = await response.json()
    if (!data?.user) return null
    return data
  } catch (err) {
    console.error('Error fetching session from Better Auth:', err)
    return null
  }
}


async function requireAuth(req, res, next) {
  try {
    const session = await resolveSession(req)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.user = session.user
    req.session = session
    next()
  } catch (err) {
    console.error('Auth middleware error', err)
    res.status(401).json({ error: 'Unauthorized' })
  }
}

async function optionalAuth(req, res, next) {
  try {
    const session = await resolveSession(req)
    if (session?.user) {
      req.user = session.user
      req.session = session
    }
    next()
  } catch {
    next()
  }
}

module.exports = { requireAuth, optionalAuth, resolveSession }
