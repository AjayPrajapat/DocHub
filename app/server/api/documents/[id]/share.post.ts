import { nanoid } from 'nanoid'
import { getDatabase } from '../../../utils/db'
import { getUserFromEvent } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  const { id } = event.context.params as { id: string }
  const body = await readBody<{ permission: 'view' | 'edit'; expiresInDays: number }>(event)
  const db = getDatabase()
  const exists = db.prepare('SELECT id FROM documents WHERE id = ?').get(id)
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  const shareId = nanoid()
  const expiresAt = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO document_shares(id, document_id, permission, expires_at, created_by) VALUES(?, ?, ?, ?, ?)').run(
    shareId,
    id,
    body.permission,
    expiresAt,
    user.sub
  )
  const origin = getRequestURL(event).origin
  return { url: `${origin}/share/${shareId}` }
})
