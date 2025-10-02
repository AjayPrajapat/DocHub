import { getDatabase } from '../../utils/db'
import { verifyRefreshToken, generateTokens } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ refreshToken: string }>(event)
  if (!body.refreshToken) {
    throw createError({ statusCode: 400, statusMessage: 'Refresh token required' })
  }
  const db = getDatabase()
  const stored = db.prepare('SELECT user_id FROM refresh_tokens WHERE token = ?').get(body.refreshToken) as
    | { user_id: string }
    | undefined
  if (!stored) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid refresh token' })
  }
  const payload = verifyRefreshToken(body.refreshToken)
  const tokens = generateTokens({ sub: payload.sub, role: payload.role })
  db.prepare('UPDATE refresh_tokens SET token = ? WHERE user_id = ?').run(tokens.refreshToken, stored.user_id)
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
})
