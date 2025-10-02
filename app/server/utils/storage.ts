import { promises as fs } from 'node:fs'
import { join, dirname } from 'pathe'
import mime from 'mime'

export const saveFile = async (filePath: string, data: Buffer) => {
  const dir = dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, data)
}

export const getStoragePath = (filename: string) => {
  const config = useRuntimeConfig()
  const base = config.storagePath || 'storage'
  return join(process.cwd(), base, filename)
}

export const detectMime = (filename: string) => mime.getType(filename) || 'application/octet-stream'
