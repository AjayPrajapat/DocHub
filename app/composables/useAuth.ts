import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { currentUser, accessToken, refreshToken } = storeToRefs(authStore)

  return {
    currentUser,
    accessToken,
    refreshToken,
    isAuthenticated: computed(() => Boolean(accessToken.value)),
    login: authStore.login,
    logout: authStore.logout,
    refresh: authStore.refresh,
    fetchProfile: authStore.fetchProfile,
    requireRole: authStore.requireRole
  }
}
