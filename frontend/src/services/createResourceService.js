import { api, USE_REAL_API, mockDelay } from './api'

// Builds a standard CRUD service for one resource. In mock mode it operates
// on an in-memory copy of the seed data; in real mode every method maps
// 1:1 onto the matching Spring Boot REST endpoint, so call sites in
// components/pages never need to change when the backend is connected.
export function createResourceService(resourcePath, seedData, idField = 'id') {
  let store = [...seedData]

  return {
    async list() {
      if (USE_REAL_API) return api.get(`/${resourcePath}`)
      await mockDelay()
      return [...store]
    },

    async get(id) {
      if (USE_REAL_API) return api.get(`/${resourcePath}/${id}`)
      await mockDelay(200)
      const item = store.find((r) => r[idField] === id)
      if (!item) throw new Error('Record not found.')
      return item
    },

    async create(payload) {
      if (USE_REAL_API) return api.post(`/${resourcePath}`, payload)
      await mockDelay(400)
      const nextId = `${resourcePath.slice(0, 2).toUpperCase()}-${1000 + store.length + 1}`
      const record = { [idField]: payload[idField] || nextId, ...payload }
      store = [record, ...store]
      return record
    },

    async update(id, payload) {
      if (USE_REAL_API) return api.put(`/${resourcePath}/${id}`, payload)
      await mockDelay(350)
      store = store.map((r) => (r[idField] === id ? { ...r, ...payload } : r))
      return store.find((r) => r[idField] === id)
    },

    async remove(id) {
      if (USE_REAL_API) return api.delete(`/${resourcePath}/${id}`)
      await mockDelay(300)
      store = store.filter((r) => r[idField] !== id)
      return { success: true }
    },
  }
}
