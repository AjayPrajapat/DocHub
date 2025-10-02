import { getDatabase } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const payload = getUserFromEvent(event)
  const db = getDatabase()
  const stmt = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?')
  const user = stmt.get(payload.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }
  return user
})
