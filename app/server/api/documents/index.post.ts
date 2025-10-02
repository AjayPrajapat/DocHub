import { nanoid } from 'nanoid'
import { getUserFromEvent } from '../../utils/auth'
import { getDatabase } from '../../utils/db'
import { detectMime, getStoragePath, saveFile } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!['admin', 'editor'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  const config = useRuntimeConfig()
  const form = await readMultipartFormData(event, {
    maxFileSize: config.public.uploadMaxSizeMb * 1024 * 1024
  })
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid form data' })
  }
  const fields = Object.fromEntries(form.filter((part) => part.type === 'field').map((part) => [part.name, part.data?.toString() ?? '']))
  const filePart = form.find((part) => part.type === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'File upload required' })
  }
  const documentId = nanoid()
  const version = 1
  const mimeType = detectMime(filePart.filename)
  const storageKey = `documents/${documentId}/v${version}/${filePart.filename}`
  const storagePath = getStoragePath(storageKey)
  await saveFile(storagePath, filePart.data)

  const db = getDatabase()
  const now = new Date().toISOString()
  const tags = fields.tags ? JSON.parse(fields.tags) : []
  db.prepare(
    `INSERT INTO documents(id, title, description, tags, folder_path, current_version, created_by, created_at, updated_at, mime_type, file_name, search_text)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    documentId,
    fields.title,
    fields.description,
    JSON.stringify(tags),
    fields.folderPath || null,
    version,
    user.sub,
    now,
    now,
    mimeType,
    filePart.filename,
    `${fields.title} ${fields.description}`
  )

  db.prepare(
    `INSERT INTO document_versions(id, document_id, version, file_path, mime_type, file_name, updated_at, updated_by, content_preview)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(nanoid(), documentId, version, storageKey, mimeType, filePart.filename, now, user.sub, fields.description?.slice(0, 200) ?? '')

  db.prepare(
    `INSERT INTO audit_log(id, document_id, actor_id, action, timestamp)
     VALUES(?, ?, ?, ?, ?)`
  ).run(nanoid(), documentId, user.sub, 'uploaded', now)

  return { id: documentId }
})
