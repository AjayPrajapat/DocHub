export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:created', () => {
    const auth = useAuth()
    nuxtApp.$fetch = $fetch.create({
      onRequest({ options }) {
        if (auth.accessToken.value) {
          options.headers = {
            ...(options.headers as Record<string, string> | undefined),
            Authorization: `Bearer ${auth.accessToken.value}`
          }
        }
      },
      onResponseError({ response }) {
        if (response.status === 401 && auth.refreshToken.value) {
          auth.refresh()
        }
      }
    })
  })
})
