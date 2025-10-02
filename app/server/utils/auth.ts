import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { verifyAccessToken } from './jwt'

export const hashPassword = (password: string) => bcrypt.hashSync(password, 10)
export const comparePassword = (password: string, hash: string) => bcrypt.compareSync(password, hash)

export const getUserFromEvent = (event: H3Event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const token = authHeader.replace('Bearer ', '')
  try {
    return verifyAccessToken(token)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
}
