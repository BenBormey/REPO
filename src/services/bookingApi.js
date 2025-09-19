import api from './api'

const base = 'Booking'

export const BookingApi = {
  list() {
    return api.get(base)                  // GET /api/Booking
  },
  get(id) {
    return api.get(`${base}/${id}`)       // GET /api/Booking/{id}
  },
  create(payload) {
    return api.post(base, payload)        // POST /api/Booking
  },
  update(id, payload) {
    return api.put(`${base}/${id}`, payload) // PUT /api/Booking/{id}
  },
  remove(id) {
    return api.delete(`${base}/${id}`)    // DELETE /api/Booking/{id}
  },
  confirm(id) {
    return api.patch(`${base}/${id}/confirm`)
  },
  complete(id) {
    return api.patch(`${base}/${id}/complete`)
  },
  cancel(id) {
    return api.patch(`${base}/${id}/cancel`)
  }
}
