<template>
  <section class="space-y-6">
    <NuxtLink to="/dashboard" class="text-sm text-primary hover:underline">← Back to dashboard</NuxtLink>
    <div class="rounded-lg bg-white p-6 shadow">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">{{ document?.title }}</h1>
          <p class="text-sm text-slate-500">Version {{ document?.version }} · Last updated {{ formatDate(document?.updatedAt) }}</p>
        </div>
        <div class="flex gap-3">
          <button class="rounded-md border border-slate-300 px-3 py-2 text-sm" @click="downloadDocument(document?.id || '')">
            Download
          </button>
          <button
            v-if="canEdit"
            class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
            @click="showEdit = true"
          >
            Edit metadata
          </button>
        </div>
      </div>
      <p class="mt-4 text-slate-600">{{ document?.description }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <span v-for="tag in document?.tags" :key="tag" class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          #{{ tag }}
        </span>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div class="space-y-6">
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Preview</h2>
          <div v-if="document?.mimeType === 'application/pdf'" class="mt-4 h-[600px] overflow-hidden rounded-lg border">
            <iframe :src="previewUrl" class="h-full w-full" />
          </div>
          <div v-else-if="document?.mimeType?.startsWith('image/')" class="mt-4">
            <img :src="previewUrl" :alt="document?.title" class="max-h-[600px] w-full rounded-lg object-contain" />
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">Preview not available for this file type.</p>
        </div>

        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Audit trail</h2>
          <ul class="mt-4 space-y-3">
            <li v-for="entry in auditLog" :key="entry.id" class="border-b pb-2 text-sm text-slate-600">
              <p class="font-medium text-slate-700">{{ entry.action }} by {{ entry.actor }}</p>
              <p class="text-xs text-slate-500">{{ formatDate(entry.timestamp) }}</p>
            </li>
          </ul>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Versions</h2>
          <ul class="mt-4 space-y-2 text-sm text-slate-600">
            <li v-for="version in versions" :key="version.version">
              <div class="flex items-center justify-between">
                <span>Version {{ version.version }}</span>
                <div class="flex items-center gap-2">
                  <button class="text-primary" @click="restoreVersion(version.version)">Restore</button>
                  <button class="text-primary" @click="downloadVersion(version.version)">Download</button>
                </div>
              </div>
              <p class="text-xs text-slate-500">Updated {{ formatDate(version.updatedAt) }} by {{ version.updatedBy }}</p>
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Share</h2>
          <form class="mt-4 space-y-4" @submit.prevent="createShareLink">
            <div>
              <label class="block text-sm font-medium text-slate-700">Permission</label>
              <select v-model="sharePermission" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="view">View only</option>
                <option value="edit">Edit</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Expires in (days)</label>
              <input v-model.number="shareExpiration" type="number" min="1" max="30" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </div>
            <button type="submit" class="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
              Generate link
            </button>
          </form>
          <div v-if="shareLink" class="mt-4 rounded-md bg-slate-100 p-3 text-sm">
            <p class="break-all">{{ shareLink }}</p>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 class="text-lg font-semibold text-slate-800">Edit metadata</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="block text-sm">Title</label>
                <input v-model="editForm.title" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm">Description</label>
                <textarea v-model="editForm.description" rows="3" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea>
              </div>
              <div>
                <label class="block text-sm">Tags</label>
                <input v-model="editForm.tags" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button class="rounded-md border border-slate-300 px-3 py-2 text-sm" @click="showEdit = false">Cancel</button>
              <button class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white" @click="updateMetadata">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const { requireRole } = useAuth()
const { getDocument, fetchDocument, downloadDocument, downloadVersion, restoreVersion, createShare, getAuditLog, updateDocument } = useDocuments()

const showEdit = ref(false)
const sharePermission = ref<'view' | 'edit'>('view')
const shareExpiration = ref(7)
const shareLink = ref('')

const document = computed(() => getDocument(route.params.id as string))
const versions = computed(() => document.value?.versions ?? [])
const auditLog = computed(() => getAuditLog(route.params.id as string))

const previewUrl = computed(() =>
  document.value ? `/api/documents/${document.value.id}/download?inline=true&version=${document.value.version}` : ''
)

const canEdit = computed(() => requireRole(['admin', 'editor']))
const editForm = reactive({ title: '', description: '', tags: '' })

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '')

watchEffect(() => {
  if (document.value) {
    editForm.title = document.value.title
    editForm.description = document.value.description
    editForm.tags = document.value.tags.join(', ')
  }
})

const updateMetadata = async () => {
  if (!document.value) return
  await updateDocument(document.value.id, {
    title: editForm.title,
    description: editForm.description,
    tags: editForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
  })
  showEdit.value = false
}

const createShareLink = async () => {
  if (!document.value) return
  shareLink.value = await createShare(document.value.id, {
    permission: sharePermission.value,
    expiresInDays: shareExpiration.value
  })
}

await callOnce(async () => {
  await fetchDocument(route.params.id as string)
})
</script>
