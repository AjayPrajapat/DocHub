import { defineStore } from 'pinia'
import type { UploadPayload } from '~/components/DocumentUploadForm.vue'

export interface DocumentVersion {
  version: number
  updatedAt: string
  updatedBy: string
}

export interface DocumentDetail {
  id: string
  title: string
  description: string
  tags: string[]
  version: number
  createdBy: string
  updatedAt: string
  mimeType: string
  folderPath?: string
  versions: DocumentVersion[]
  contentPreview?: string
}

export interface DocumentFilters {
  search?: string
  tag?: string
  owner?: string
  date?: string
  folder?: string
}

interface AuditEntry {
  id: string
  action: string
  actor: string
  timestamp: string
}

interface FolderSummary {
  name: string
  path: string
  count: number
}

export const useDocumentsStore = defineStore('documents', {
  state: () => ({
    documents: [] as DocumentDetail[],
    selectedDocument: null as DocumentDetail | null,
    auditLogs: {} as Record<string, AuditEntry[]>,
    filters: {} as DocumentFilters,
    folders: [] as FolderSummary[]
  }),
  actions: {
    async fetchDocuments(params: DocumentFilters = {}) {
      const data = await $fetch<{ documents: DocumentDetail[]; folders: FolderSummary[] }>(`/api/documents`, {
        query: params
      })
      this.documents = data.documents
      this.folders = data.folders
      return data.documents
    },
    async fetchDocument(id: string) {
      const data = await $fetch<{ document: DocumentDetail; audit: AuditEntry[] }>(`/api/documents/${id}`)
      this.selectedDocument = data.document
      this.auditLogs = { ...this.auditLogs, [id]: data.audit }
      const index = this.documents.findIndex((doc) => doc.id === id)
      if (index >= 0) {
        this.documents.splice(index, 1, data.document)
      } else {
        this.documents.push(data.document)
      }
      return data.document
    },
    async uploadDocument(payload: UploadPayload) {
      const form = new FormData()
      form.append('title', payload.title)
      form.append('description', payload.description)
      form.append('tags', JSON.stringify(payload.tags))
      form.append('folderPath', payload.folderPath)
      form.append('file', payload.file)
      await $fetch('/api/documents', {
        method: 'POST',
        body: form
      })
      await this.fetchDocuments(this.filters)
    },
    async updateDocument(id: string, body: Partial<Omit<DocumentDetail, 'id' | 'versions'>>) {
      const response = await $fetch<{ document: DocumentDetail }>(`/api/documents/${id}`, {
        method: 'PUT',
        body
      })
      this.selectedDocument = response.document
      const index = this.documents.findIndex((doc) => doc.id === id)
      if (index >= 0) {
        this.documents.splice(index, 1, response.document)
      }
      return response.document
    },
    async deleteDocument(id: string) {
      await $fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      })
      this.documents = this.documents.filter((doc) => doc.id !== id)
    },
    async downloadDocument(id: string) {
      const url = `/api/documents/${id}/download`
      window.open(url, '_blank')
    },
    async downloadVersion(version: number) {
      if (!this.selectedDocument) return
      const url = `/api/documents/${this.selectedDocument.id}/download?version=${version}`
      window.open(url, '_blank')
    },
    async restoreVersion(version: number) {
      if (!this.selectedDocument) return
      const response = await $fetch<{ document: DocumentDetail }>(`/api/documents/${this.selectedDocument.id}/version`, {
        method: 'POST',
        body: { version }
      })
      this.selectedDocument = response.document
    },
    async createShare(id: string, payload: { permission: 'view' | 'edit'; expiresInDays: number }) {
      const response = await $fetch<{ url: string }>(`/api/documents/${id}/share`, {
        method: 'POST',
        body: payload
      })
      return response.url
    },
    getDocument(id: string) {
      if (this.selectedDocument?.id === id) {
        return this.selectedDocument
      }
      return this.documents.find((doc) => doc.id === id) ?? null
    },
    getAuditLog(id: string) {
      return this.auditLogs[id] ?? []
    },
    setFilters(filters: Record<string, string>) {
      this.filters = { ...this.filters, ...filters }
    }
  }
})
