import { storeToRefs } from 'pinia'
import { useDocumentsStore } from '~/stores/documents'

export const useDocuments = () => {
  const documentsStore = useDocumentsStore()
  const { documents, selectedDocument, filters, folders } = storeToRefs(documentsStore)

  return {
    documents,
    folders,
    filters,
    getDocument: documentsStore.getDocument,
    getAuditLog: documentsStore.getAuditLog,
    fetchDocuments: documentsStore.fetchDocuments,
    fetchDocument: documentsStore.fetchDocument,
    uploadDocument: documentsStore.uploadDocument,
    updateDocument: documentsStore.updateDocument,
    deleteDocument: documentsStore.deleteDocument,
    downloadDocument: documentsStore.downloadDocument,
    downloadVersion: documentsStore.downloadVersion,
    restoreVersion: documentsStore.restoreVersion,
    createShare: documentsStore.createShare,
    selectedDocument,
    setFilters: documentsStore.setFilters
  }
}
