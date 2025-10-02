<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap gap-3">
        <input
          v-model="filters.search"
          class="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring"
          placeholder="Search by title or content"
          @input="triggerSearch"
        />
        <input
          v-model="filters.tag"
          class="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring"
          placeholder="Tag"
          @input="triggerSearch"
        />
        <select v-model="filters.owner" class="rounded-md border border-slate-300 px-3 py-2 text-sm" @change="triggerSearch">
          <option value="">All owners</option>
          <option v-for="owner in owners" :key="owner" :value="owner">{{ owner }}</option>
        </select>
        <input
          v-model="filters.date"
          type="date"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm"
          @change="triggerSearch"
        />
      </div>
      <div class="flex items-center gap-2">
        <button class="text-sm text-slate-600 hover:text-primary" @click="resetFilters">Reset</button>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div
        v-for="item in filteredDocuments"
        :key="item.id"
        class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink :to="`/document/${item.id}`" class="text-lg font-semibold text-primary hover:underline">
              {{ item.title }}
            </NuxtLink>
            <p class="text-xs text-slate-500">Version {{ item.version }} · Updated {{ formatDate(item.updatedAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        <p class="mt-3 text-sm text-slate-600">{{ item.description }}</p>
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Owner: {{ item.createdBy }}</span>
          <div class="flex gap-3">
            <button class="text-primary" @click="emit('download', item.id)">Download</button>
            <button v-if="canEdit" class="text-primary" @click="emit('edit', item.id)">Edit</button>
            <button v-if="canEdit" class="text-red-500" @click="emit('delete', item.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
const props = defineProps<{ documents: Array<DocumentSummary>; owners: string[]; canEdit: boolean }>()
const emit = defineEmits<{
  (e: 'download', id: string): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'update:filters', filters: Record<string, string>): void
}>()

const filters = reactive({ search: '', tag: '', owner: '', date: '' })

const filteredDocuments = computed(() => {
  return props.documents.filter((doc) => {
    const matchesSearch =
      !filters.search ||
      doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      doc.contentPreview?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesTag = !filters.tag || doc.tags.includes(filters.tag)
    const matchesOwner = !filters.owner || doc.createdBy === filters.owner
    const matchesDate = !filters.date || doc.updatedAt.startsWith(filters.date)
    return matchesSearch && matchesTag && matchesOwner && matchesDate
  })
})

const triggerSearch = useDebounceFn(() => emit('update:filters', { ...filters }), 300)

const resetFilters = () => {
  filters.search = ''
  filters.tag = ''
  filters.owner = ''
  filters.date = ''
  emit('update:filters', { ...filters })
}

const formatDate = (value: string) => new Date(value).toLocaleString()
</script>

<script lang="ts">
export interface DocumentSummary {
  id: string
  title: string
  description: string
  tags: string[]
  version: number
  createdBy: string
  updatedAt: string
  contentPreview?: string
}
</script>
