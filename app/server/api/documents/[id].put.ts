import { nanoid } from 'nanoid'
import { getDatabase } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!['admin', 'editor'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  const { id } = event.context.params as { id: string }
  const body = await readBody<{ title?: string; description?: string; tags?: string[]; folderPath?: string }>(event)
  const db = getDatabase()
  const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE documents
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            tags = COALESCE(?, tags),
            folder_path = COALESCE(?, folder_path),
            search_text = COALESCE(?, search_text),
            updated_at = ?
      WHERE id = ?`
  ).run(
    body.title,
    body.description,
    body.tags ? JSON.stringify(body.tags) : undefined,
    body.folderPath,
    body.title || body.description ? `${body.title ?? ''} ${body.description ?? ''}`.trim() : undefined,
    now,
    id
  )
  db.prepare('INSERT INTO audit_log(id, document_id, actor_id, action, timestamp) VALUES(?, ?, ?, ?, ?)').run(
    nanoid(),
    id,
    user.sub,
    'metadata updated',
    now
  )
  const updated = db
    .prepare(
      `SELECT d.id, d.title, d.description, d.tags, d.folder_path as folderPath, d.current_version as version,
              COALESCE(u.name, d.created_by) as createdBy, d.updated_at as updatedAt, d.mime_type as mimeType
         FROM documents d
         LEFT JOIN users u ON u.id = d.created_by
        WHERE d.id = ?`
    )
    .get(id) as {
      id: string
      title: string
      description: string
      tags: string
      folderPath: string | null
      version: number
      createdBy: string
      updatedAt: string
      mimeType: string
    }
  const versions = db
    .prepare('SELECT version, updated_at as updatedAt, updated_by as updatedBy FROM document_versions WHERE document_id = ? ORDER BY version DESC')
    .all(id) as Array<{ version: number; updatedAt: string; updatedBy: string }>
  return {
    document: {
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
      versions
    }
  }
})
