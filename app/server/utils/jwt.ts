import jwt from 'jsonwebtoken'

interface TokenPayload {
  sub: string
  role: 'admin' | 'editor' | 'viewer'
  exp?: number
}

export const generateTokens = (payload: TokenPayload) => {
  const config = useRuntimeConfig()
  const accessToken = jwt.sign(payload, config.jwtAccessSecret as string, { expiresIn: '15m' })
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret as string, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string) => {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtAccessSecret as string) as TokenPayload
}

export const verifyRefreshToken = (token: string) => {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtRefreshSecret as string) as TokenPayload
}

export type { TokenPayload }
