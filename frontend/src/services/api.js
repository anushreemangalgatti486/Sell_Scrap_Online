import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('sb_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sb_token')
      delete api.defaults.headers.common['Authorization']
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Convenience helpers
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
  forgot:   (email)=> api.post('/auth/forgot-password', { email }),
  reset:    (data) => api.post('/auth/reset-password', data),
}

export const materialsAPI = {
  getAll:   (params) => api.get('/materials', { params }),
  getOne:   (id)     => api.get(`/materials/${id}`),
  create:   (data)   => api.post('/materials', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:   (id, d)  => api.put(`/materials/${id}`, d),
  delete:   (id)     => api.delete(`/materials/${id}`),
  getMine:  (params) => api.get('/materials/mine', { params }),
}

export const bidsAPI = {
  place:    (materialId, amount) => api.post(`/bids/${materialId}`, { amount }),
  getForMaterial: (id) => api.get(`/bids/material/${id}`),
  getMyBids:      ()   => api.get('/bids/mine'),
}

export const auctionsAPI = {
  getActive:    ()   => api.get('/auctions/active'),
  getOne:       (id) => api.get(`/auctions/${id}`),
  close:        (id) => api.post(`/auctions/${id}/close`),
}

export const transactionsAPI = {
  getMine:   () => api.get('/transactions/mine'),
  getOne:    (id) => api.get(`/transactions/${id}`),
  initiate:  (id) => api.post(`/transactions/${id}/initiate`),
  confirm:   (id, data) => api.post(`/transactions/${id}/confirm`, data || {}),
  cancel:    (id) => api.post(`/transactions/${id}/cancel`),
}

export const paymentAPI = {
  createOrder: (transactionId) => api.post('/payments/create-order', { transactionId }),
  verify:      (data) => api.post('/payments/verify', data),
  recordWeighment: (id, weighment) => api.post(`/payments/transactions/${id}/weighment`, { weighment }),
  settle:      (id) => api.post(`/payments/transactions/${id}/settle`),
}

export const buyerAPI = {
  getStats:    () => api.get('/buyer/stats'),
  getAnalytics:() => api.get('/buyer/analytics'),
}

export const sellerAPI = {
  getStats:    () => api.get('/seller/stats'),
  getAnalytics:() => api.get('/seller/analytics'),
}

export const notificationsAPI = {
  getMine:   () => api.get('/notifications'),
  markRead:  (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export const adminAPI = {
  getUsers:        (params) => api.get('/admin/users', { params }),
  suspendUser:     (id, active) => api.post(`/admin/users/${id}/suspend`, { active }),
  getPending:      ()       => api.get('/admin/verifications/pending'),
  approve:         (id)     => api.post(`/admin/verifications/${id}/approve`),
  reject:          (id, r)  => api.post(`/admin/verifications/${id}/reject`, { reason: r }),
  getListings:     (params) => api.get('/admin/listings', { params }),
  removeListing:   (id)     => api.delete(`/admin/listings/${id}`),
  getStats:        ()       => api.get('/admin/stats'),
  getTransactions: ()       => api.get('/admin/transactions'),
  getAuctions:     (params) => api.get('/admin/auctions', { params }),
  closeAuction:    (id)     => api.post(`/admin/auctions/${id}/close`),
  getSettings:    ()       => api.get('/admin/settings'),
  updateSettings: (data)   => api.put('/admin/settings', data),
}

export const businessAPI = {
  submitVerification: (data) => api.post('/business/verify', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getProfile:         ()     => api.get('/business/profile'),
  updateProfile:      (data) => api.put('/business/profile', data),
}
