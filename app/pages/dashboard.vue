<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Document Library</h1>
        <p class="text-sm text-slate-500">Browse and manage your documents.</p>
      </div>
      <NuxtLink
        v-if="canEdit"
        to="/upload"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Upload document
      </NuxtLink>
    </div>

    <div v-if="breadcrumbs.length" class="text-sm text-slate-500">
      <span>Folder: </span>
      <span>
        <NuxtLink to="/dashboard" class="text-primary hover:underline">Root</NuxtLink>
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
          <span> / </span>
          <NuxtLink :to="`/dashboard?folder=${encodeURIComponent(crumb.path)}`" class="text-primary hover:underline">
            {{ crumb.name }}
          </NuxtLink>
        </template>
      </span>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div
        v-for="folder in folders"
        :key="folder.path"
        class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
      >
        <div>
          <p class="text-lg font-medium text-primary">{{ folder.name }}</p>
          <p class="text-xs text-slate-500">{{ folder.count }} items</p>
        </div>
        <NuxtLink
          :to="`/dashboard?folder=${encodeURIComponent(folder.path)}`"
          class="text-sm text-primary hover:underline"
        >
          Open
        </NuxtLink>
      </div>
    </div>

    <DocumentList
      :documents="documents"
      :owners="owners"
      :can-edit="canEdit"
      @download="downloadDocument"
      @delete="deleteDocument"
      @update:filters="updateFilters"
    />
  </section>
</template>

<script setup lang="ts">
const { currentUser, requireRole } = useAuth()
const { documents, folders, fetchDocuments, deleteDocument, downloadDocument, filters, setFilters } = useDocuments()
const route = useRoute()

const canEdit = computed(() => requireRole(['admin', 'editor']))

const breadcrumbs = computed(() => {
  const folderParam = (route.query.folder as string) || ''
  if (!folderParam) {
    return []
  }
  const segments = folderParam.split('/').filter(Boolean)
  return segments.map((segment, index) => ({
    name: segment,
    path: segments.slice(0, index + 1).join('/')
  }))
})

const owners = computed(() => Array.from(new Set(documents.value.map((doc) => doc.createdBy))))

watch(
  () => route.query.folder,
  async (folder) => {
    await fetchDocuments({ ...filters.value, folder: (folder as string) || '' })
  },
  { immediate: true }
)

const updateFilters = async (payload: Record<string, string>) => {
  setFilters(payload)
  await fetchDocuments({ ...filters.value, folder: (route.query.folder as string) || '' })
}

await callOnce(async () => {
  if (!currentUser.value) {
    await useAuth().fetchProfile()
  }
  await fetchDocuments({ folder: (route.query.folder as string) || '' })
})
</script>
