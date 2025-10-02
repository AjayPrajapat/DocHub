import { getDatabase } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  getUserFromEvent(event)
  const { id } = event.context.params as { id: string }
  const db = getDatabase()
  const doc = db
    .prepare(
      `SELECT d.id, d.title, d.description, d.tags, d.folder_path as folderPath, d.current_version as version, COALESCE(u.name, d.created_by) as createdBy,
              d.updated_at as updatedAt, d.mime_type as mimeType
         FROM documents d
         LEFT JOIN users u ON u.id = d.created_by
        WHERE d.id = ?`
    )
    .get(id) as
    | {
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
    | undefined
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  const versions = db
    .prepare('SELECT version, updated_at as updatedAt, updated_by as updatedBy FROM document_versions WHERE document_id = ? ORDER BY version DESC')
    .all(id) as Array<{ version: number; updatedAt: string; updatedBy: string }>
  const audit = db
    .prepare(
      `SELECT al.id, COALESCE(u.name, al.actor_id) as actor, al.action, al.timestamp
         FROM audit_log al
         LEFT JOIN users u ON u.id = al.actor_id
        WHERE al.document_id = ?
        ORDER BY al.timestamp DESC`
    )
    .all(id) as Array<{ id: string; actor: string; action: string; timestamp: string }>
  return {
    document: {
      ...doc,
      tags: JSON.parse(doc.tags || '[]'),
      versions
    },
    audit
  }
})
