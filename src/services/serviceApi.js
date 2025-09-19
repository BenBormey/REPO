import api from './api'

const base = 'Service' // -> /api/Service

export const ServiceApi = {
  list() {
    return api.get(base) // GET /api/Service
  },
  get(id) {
    return api.get(base + '/' + id) // GET /api/Service/{id}
  },
  create(payload) {
    return api.post(base, payload) // POST /api/Service
  },
  update(id, payload) {
    return api.put(base + '/' + id, payload) // PUT /api/Service/{id}
  },
  remove(id) {
    return api.delete(base + '/' + id) // DELETE /api/Service/{id}
  },
  uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file) // Swagger shows "image" field
    return api.post('Upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}