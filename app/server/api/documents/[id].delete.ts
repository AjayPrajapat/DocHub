import { promises as fs } from 'node:fs'
import { join } from 'pathe'
import { getDatabase } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }
  const { id } = event.context.params as { id: string }
  const db = getDatabase()
  const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  db.prepare('DELETE FROM documents WHERE id = ?').run(id)
  db.prepare('DELETE FROM document_versions WHERE document_id = ?').run(id)
  db.prepare('DELETE FROM audit_log WHERE document_id = ?').run(id)
  const config = useRuntimeConfig()
  const base = join(process.cwd(), config.storagePath || 'storage', 'documents', id)
  await fs.rm(base, { recursive: true, force: true })
  return { success: true }
})
