import { getDatabase } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  getUserFromEvent(event)
  const query = getQuery(event)
  const db = getDatabase()
  const filters: string[] = []
  const params: unknown[] = []

  if (query.search) {
    filters.push('(d.title LIKE ? OR d.description LIKE ? OR d.search_text LIKE ?)')
    const like = `%${query.search}%`
    params.push(like, like, like)
  }
  if (query.tag) {
    filters.push('d.tags LIKE ?')
    params.push(`%${query.tag}%`)
  }
  if (query.owner) {
    filters.push('d.created_by = ?')
    params.push(query.owner)
  }
  if (query.date) {
    filters.push("date(d.updated_at) = date(?)")
    params.push(query.date)
  }
  const folderParam = typeof query.folder === 'string' ? query.folder : ''
  if (folderParam) {
    filters.push('(d.folder_path = ? OR d.folder_path LIKE ? || "/%")')
    params.push(folderParam, folderParam)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT d.id, d.title, d.description, d.tags, d.current_version as version, d.created_by as createdBy, u.name as createdByName, d.updated_at as updatedAt,
              d.mime_type as mimeType, d.folder_path as folderPath, d.file_name as fileName, dv.content_preview as contentPreview
         FROM documents d
         LEFT JOIN users u ON u.id = d.created_by
         LEFT JOIN document_versions dv ON dv.document_id = d.id AND dv.version = d.current_version
         ${whereClause}
         ORDER BY d.updated_at DESC`
    )
    .all(...params) as Array<{
      id: string
      title: string
      description: string
      tags: string
      version: number
      createdBy: string
      createdByName?: string | null
      updatedAt: string
      mimeType: string
      folderPath?: string | null
      fileName: string
      contentPreview?: string | null
    }>

  const currentFolder = folderParam || ''
  const documents = rows
    .filter((row) => {
      if (!currentFolder) {
        return !row.folderPath
      }
      return row.folderPath === currentFolder
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      tags: JSON.parse(row.tags || '[]'),
      version: row.version,
      createdBy: row.createdByName || row.createdBy,
      updatedAt: row.updatedAt,
      mimeType: row.mimeType,
      folderPath: row.folderPath ?? undefined,
      versions: [],
      contentPreview: row.contentPreview ?? undefined
    }))

  const foldersMap = new Map<string, { name: string; path: string; count: number }>()
  rows.forEach((row) => {
    const folderPath = row.folderPath || ''
    if (!currentFolder) {
      if (!folderPath) return
      const [next] = folderPath.split('/')
      if (!next) return
      const path = next
      foldersMap.set(path, {
        name: next,
        path,
        count: (foldersMap.get(path)?.count ?? 0) + 1
      })
    } else if (folderPath.startsWith(`${currentFolder}/`)) {
      const remainder = folderPath.slice(currentFolder.length + 1)
      const [next] = remainder.split('/')
      if (!next) return
      const path = `${currentFolder}/${next}`
      foldersMap.set(path, {
        name: next,
        path,
        count: (foldersMap.get(path)?.count ?? 0) + 1
      })
    }
  })

  const folders = Array.from(foldersMap.values())

  return { documents, folders }
})
