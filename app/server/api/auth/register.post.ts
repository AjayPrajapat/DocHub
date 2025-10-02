import { nanoid } from 'nanoid'
import { getDatabase } from '../../utils/db'
import { hashPassword } from '../../utils/auth'
import { generateTokens } from '../../utils/jwt'

interface RegisterBody {
  email: string
  password: string
  name: string
  role?: 'admin' | 'editor' | 'viewer'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const db = getDatabase()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email)
  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Email already registered' })
  }
  const id = nanoid()
  const role = body.role || 'viewer'
  db.prepare('INSERT INTO users(id, email, name, passwordHash, role) VALUES(?, ?, ?, ?, ?)').run(
    id,
    body.email,
    body.name,
    hashPassword(body.password),
    role
  )
  const tokens = generateTokens({ sub: id, role })
  db.prepare('INSERT INTO refresh_tokens(id, user_id, token) VALUES(?, ?, ?)').run(nanoid(), id, tokens.refreshToken)
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id, email: body.email, name: body.name, role }
  }
})
