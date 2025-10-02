import { nanoid } from 'nanoid'
import { getDatabase } from '../../../utils/db'
import { getUserFromEvent } from '../../../utils/auth'
import { detectMime, getStoragePath, saveFile } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!['admin', 'editor'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  const { id } = event.context.params as { id: string }
  const db = getDatabase()
  const document = db.prepare('SELECT current_version as version, file_name FROM documents WHERE id = ?').get(id) as
    | { version: number; file_name: string }
    | undefined
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  if (event.node.req.headers['content-type']?.startsWith('multipart/form-data')) {
    const config = useRuntimeConfig()
    const form = await readMultipartFormData(event, {
      maxFileSize: config.public.uploadMaxSizeMb * 1024 * 1024
    })
    if (!form) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid form data' })
    }
    const filePart = form.find((part) => part.type === 'file')
    if (!filePart || !filePart.data || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: 'File required' })
    }
    const nextVersion = document.version + 1
    const mimeType = detectMime(filePart.filename)
    const storageKey = `documents/${id}/v${nextVersion}/${filePart.filename}`
    await saveFile(getStoragePath(storageKey), filePart.data)
    const now = new Date().toISOString()
    db.prepare('UPDATE documents SET current_version = ?, file_name = ?, mime_type = ?, updated_at = ? WHERE id = ?').run(
      nextVersion,
      filePart.filename,
      mimeType,
      now,
      id
    )
    db.prepare(
      'INSERT INTO document_versions(id, document_id, version, file_path, mime_type, file_name, updated_at, updated_by, content_preview) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      nanoid(),
      id,
      nextVersion,
      storageKey,
      mimeType,
      filePart.filename,
      now,
      user.sub,
      ''
    )
    db.prepare('INSERT INTO audit_log(id, document_id, actor_id, action, timestamp) VALUES(?, ?, ?, ?, ?)').run(
      nanoid(),
      id,
      user.sub,
      'uploaded new version',
      now
    )
  } else {
    const body = await readBody<{ version: number }>(event)
    const target = db
      .prepare('SELECT version, file_path, mime_type, file_name FROM document_versions WHERE document_id = ? AND version = ?')
      .get(id, body.version) as { version: number; file_path: string; mime_type: string; file_name: string } | undefined
    if (!target) {
      throw createError({ statusCode: 404, statusMessage: 'Version not found' })
    }
    const now = new Date().toISOString()
    db.prepare('UPDATE documents SET current_version = ?, mime_type = ?, file_name = ?, updated_at = ? WHERE id = ?').run(
      target.version,
      target.mime_type,
      target.file_name,
      now,
      id
    )
    db.prepare('INSERT INTO audit_log(id, document_id, actor_id, action, timestamp) VALUES(?, ?, ?, ?, ?)').run(
      nanoid(),
      id,
      user.sub,
      `restored version ${target.version}`,
      now
    )
  }

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
