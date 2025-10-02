<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-semibold text-slate-800">Upload document</h1>
    <p class="text-sm text-slate-500">Add new documents with metadata and organize them into folders.</p>
    <DocumentUploadForm @submit="submit" />
  </section>
</template>

<script setup lang="ts">
import type { UploadPayload } from '~/components/DocumentUploadForm.vue'

const { uploadDocument } = useDocuments()
const router = useRouter()

const submit = async (payload: UploadPayload) => {
  await uploadDocument(payload)
  router.push('/dashboard')
}
</script>
