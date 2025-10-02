import Database from 'better-sqlite3'
import { join } from 'pathe'

let db: Database.Database | null = null

export const getDatabase = () => {
  if (!db) {
    const config = useRuntimeConfig()
    const dbPath = join(process.cwd(), config.sqlitePath)
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}
