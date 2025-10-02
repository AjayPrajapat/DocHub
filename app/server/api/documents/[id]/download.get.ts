import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'pathe'
import mime from 'mime'
import { getDatabase } from '../../../utils/db'
import { getUserFromEvent } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  const { id } = event.context.params as { id: string }
  const query = getQuery(event)
  const versionParam = query.version ? Number.parseInt(query.version as string, 10) : undefined
  const db = getDatabase()
  const versionRow = db
    .prepare(
      'SELECT file_path, mime_type, file_name FROM document_versions WHERE document_id = ? AND version = ?'
    )
    .get(id, versionParam || db.prepare('SELECT current_version FROM documents WHERE id = ?').get(id)?.current_version) as
    | { file_path: string; mime_type: string; file_name: string }
    | undefined
  if (!versionRow) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
  const inline = query.inline === 'true'
  const config = useRuntimeConfig()
  const filePath = join(process.cwd(), config.storagePath || 'storage', versionRow.file_path)
  const file = await fs.readFile(filePath)
  const disposition = inline ? 'inline' : 'attachment'
  setHeader(event, 'Content-Type', versionRow.mime_type || mime.getType(versionRow.file_name) || 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `${disposition}; filename="${versionRow.file_name}"`)
  db.prepare('INSERT INTO audit_log(id, document_id, actor_id, action, timestamp) VALUES(?, ?, ?, ?, ?)').run(
    randomUUID(),
    id,
    user.sub,
    inline ? 'previewed' : 'downloaded',
    new Date().toISOString()
  )
  return file
})
