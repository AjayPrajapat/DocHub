import { nanoid } from 'nanoid'
import { getDatabase } from '../../utils/db'
import { comparePassword } from '../../utils/auth'
import { generateTokens } from '../../utils/jwt'

interface LoginBody {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const db = getDatabase()
  const stmt = db.prepare('SELECT id, email, name, passwordHash, role FROM users WHERE email = ?')
  const user = stmt.get(body.email) as
    | { id: string; email: string; name: string; passwordHash: string; role: 'admin' | 'editor' | 'viewer' }
    | undefined
  if (!user || !comparePassword(body.password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }
  const tokens = generateTokens({ sub: user.id, role: user.role })
  db.prepare('INSERT INTO refresh_tokens(id, user_id, token) VALUES(?, ?, ?)').run(nanoid(), user.id, tokens.refreshToken)
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  }
})
