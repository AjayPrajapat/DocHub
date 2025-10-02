import { promises as fs } from 'node:fs'
import { join } from 'pathe'
import { getDatabase } from '../utils/db'

export default defineNitroPlugin(async () => {
  const db = getDatabase()
  const migrationsDir = join(process.cwd(), 'app/db/migrations')
  const files = await fs.readdir(migrationsDir)
  for (const file of files.sort()) {
    if (!file.endsWith('.sql')) continue
    const sql = await fs.readFile(join(migrationsDir, file), 'utf-8')
    db.exec(sql)
  }
})
