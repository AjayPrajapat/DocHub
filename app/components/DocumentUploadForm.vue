<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-slate-700">Title</label>
        <input v-model="form.title" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Tags (comma separated)</label>
        <input v-model="tags" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700">Description</label>
      <textarea
        v-model="form.description"
        rows="4"
        class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder="Describe the document"
      ></textarea>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700">Folder</label>
      <input v-model="form.folderPath" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="e.g. Finance/Invoices" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700">Upload file</label>
      <div
        class="mt-1 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <span v-if="!fileName">Drag & drop or click to select</span>
        <span v-else class="font-medium text-slate-700">{{ fileName }}</span>
        <input ref="fileInput" type="file" class="hidden" :accept="acceptedTypes" @change="handleFileChange" />
      </div>
      <button type="button" class="mt-2 text-sm text-primary" @click="fileInput?.click()">Browse</button>
      <p class="text-xs text-slate-400">Max size: {{ maxSize }} MB</p>
    </div>
    <div class="flex justify-end gap-3">
      <button type="reset" class="rounded-md border border-slate-300 px-4 py-2 text-sm" @click="resetForm">Cancel</button>
      <button type="submit" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white" :disabled="loading">
        {{ loading ? 'Uploading…' : 'Upload document' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'submit', payload: UploadPayload): void }>()

const { public: { uploadMaxSizeMb } } = useRuntimeConfig()

const form = reactive({
  title: '',
  description: '',
  folderPath: ''
})

const maxSize = computed(() => uploadMaxSizeMb)
const tags = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const fileName = computed(() => file.value?.name ?? '')
const acceptedTypes = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif'
const loading = ref(false)

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.folderPath = ''
  tags.value = ''
  file.value = null
  loading.value = false
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.[0]) {
    file.value = target.files[0]
  }
}

const handleDrop = (event: DragEvent) => {
  const droppedFile = event.dataTransfer?.files?.[0]
  if (droppedFile) {
    file.value = droppedFile
  }
}

const handleSubmit = async () => {
  if (!file.value) {
    return
  }
  loading.value = true
  const payload: UploadPayload = {
    title: form.title,
    description: form.description,
    tags: tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    folderPath: form.folderPath,
    file: file.value
  }
  emit('submit', payload)
  loading.value = false
  resetForm()
}
</script>

<script lang="ts">
export interface UploadPayload {
  title: string
  description: string
  tags: string[]
  folderPath: string
  file: File
}
</script>
