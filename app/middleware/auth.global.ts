import type { NavigationGuard } from '#app'

const publicRoutes = ['/login']

export default <NavigationGuard>async (to) => {
  if (publicRoutes.includes(to.path)) {
    return
  }
  const auth = useAuth()
  if (!auth.currentUser.value) {
    try {
      await auth.fetchProfile()
    } catch (error) {
      return navigateTo('/login')
    }
  }
  if (!auth.currentUser.value) {
    return navigateTo('/login')
  }
}
