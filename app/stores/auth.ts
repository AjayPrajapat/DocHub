import { defineStore } from 'pinia'
import { useCookie } from '#app'

interface LoginPayload {
  email: string
  password: string
}

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserProfile
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: useCookie<string | null>('dochub_access_token', { sameSite: 'lax' }),
    refreshToken: useCookie<string | null>('dochub_refresh_token', { sameSite: 'lax' }),
    currentUser: ref<UserProfile | null>(null)
  }),
  actions: {
    async login(payload: LoginPayload) {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: payload
      })
      this.setSession(response)
    },
    async register(payload: LoginPayload & { name: string; role?: UserProfile['role'] }) {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: payload
      })
      this.setSession(response)
    },
    async logout() {
      this.accessToken.value = null
      this.refreshToken.value = null
      this.currentUser.value = null
    },
    async refresh() {
      if (!this.refreshToken.value) return
      const response = await $fetch<{ accessToken: string }>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.refreshToken.value }
      })
      this.accessToken.value = response.accessToken
    },
    async fetchProfile() {
      try {
        const profile = await $fetch<UserProfile>('/api/auth/profile')
        this.currentUser.value = profile
        return profile
      } catch (error) {
        this.logout()
        throw error
      }
    },
    requireRole(roles: UserProfile['role'][]): boolean {
      if (!this.currentUser.value) return false
      return roles.includes(this.currentUser.value.role)
    },
    setSession(response: AuthResponse) {
      this.accessToken.value = response.accessToken
      this.refreshToken.value = response.refreshToken
      this.currentUser.value = response.user
    }
  }
})
