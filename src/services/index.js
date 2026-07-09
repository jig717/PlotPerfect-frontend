import api from './api'

export const authService = {
  login: data => api.post('/user/login', data),
  signup: data => api.post('/user/register', data),
  me:() => api.get('/user/me'),
}

export const inquiryService = {
  send: data => api.post('/inquiries', data),             
  getMine: userId => api.get(`/inquiries/user/${userId}`),
  getAll: () => api.get('/inquiries/all'),                
  delete: id => api.delete(`/inquiries/${id}`),           
  respond: (id, msg) => api.patch(`/inquiries/${id}/respond`, { message: msg }),
  getForAgent: () => api.get('/inquiries/agent'),         
};

export const threadService = {
  create: data => api.post('/threads', data),
  getMine: params => api.get('/threads', { params }),
  getById: id => api.get(`/threads/${id}`),
  getByInquiryId: inquiryId => api.get(`/threads/inquiry/${inquiryId}`),
  getMessages: (threadId) => api.get(`/threads/${threadId}/messages`),
  sendMessage: (threadId, payload) => api.post(`/threads/${threadId}/messages`, payload),
  markRead: (threadId) => api.post(`/threads/${threadId}/read`),
  update: (threadId, payload) => api.patch(`/threads/${threadId}`, payload),
};
export const propertyService = {
  getAll: params => api.get('/property/all', { params }),
  getFilters: () => api.get('/property/filters'),
  getById: (id, config) => api.get(`/property/${id}`, config),
  create: data => api.post('/property', data),
  update: (id, data) => api.put(`/property/${id}`, data),
  delete: id => api.delete(`/property/${id}`),
  myListings: () => api.get('/property/my-listings'),
  getByOwner: (ownerId) => api.get(`/property/owner/${ownerId}`),
  uploadImages: (propertyId, formData) => api.post('/propertyimage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
};

export const reviewService = {
  getLatest: (params) => api.get('/review', { params }),
  getByProperty: (propertyId) => api.get(`/review/${propertyId}`),
  create: (data) => api.post('/review', data),
  delete: (id) => api.delete(`/review/${id}`),
}

export const userService = {
  getAllUsers: () => api.get('/user/all'),
  getById: (id) => api.get(`/user/${id}`),
  getProfile: () => api.get('/user/profile'),
  updateProfile: data => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    return api.put('/user/profile', data, isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined)
  },
  updateUser: (id, data) => api.put(`/user/${id}`, data),
  deleteUser: (id) => api.delete(`/user/${id}`),
  getSaved: (userId) => api.get(`/favorite/${userId}`),      
  saveProperty: (userId, propertyId) => api.post('/favorite', { userId, propertyId }),
  unsave: (favoriteId) => api.delete(`/favorite/${favoriteId}`),
  getVisits: (params) => api.get('/visits/buyer', { params }),
  cancelVisit: (visitId) => api.patch(`/visits/${visitId}/status`, { status: 'CANCELLED' }),
};

export const agentService = { 
  getStats: () => api.get('/agent/stats'),
  getDailyViews: () => api.get('/agent/daily-views'),
  getLeadSources: () => api.get('/agent/lead-sources'),
  getCommissions: () => api.get('/agent/commissions'),
};

export const saleRequestService = {
  create: (data) => api.post('/sale-requests', data),
  getOwnerRequests: () => api.get('/sale-requests/owner'),
  getAgentOpenRequests: () => api.get('/sale-requests/agent/open'),
  getAgentRequests: () => api.get('/sale-requests/agent/mine'),
  accept: (id) => api.post(`/sale-requests/${id}/accept`),
  markSold: (id, data) => api.post(`/sale-requests/${id}/sold`, data),
  updatePayment: (id, data) => api.patch(`/sale-requests/${id}/payment`, data),
};

export const paymentService = {
  create: (data) => api.post('/payment', data),
  createAdvanceTokenOrder: (data) => api.post('/payment/advance-token/order', data),
  verifyAdvanceToken: (data) => api.post('/payment/advance-token/verify', data),
  createFullPaymentOrder: (data) => api.post('/payment/full-payment/order', data),
  verifyFullPayment: (data) => api.post('/payment/full-payment/verify', data),
  downloadInvoice: (paymentId) => api.get(`/payment/${paymentId}/invoice`, {
    responseType: 'blob',
    headers: { Accept: 'text/html' },
  }),
  getForUser: (userId) => api.get(`/payment/user/${userId}`),
  getAll: () => api.get('/payment/all'),
  update: (id, data) => api.put(`/payment/${id}`, data),
};


/* ── SUPPORT ── */
export const supportService = {
  createTicket: (data) => api.post('/support', data),   
  getAllTickets: () => api.get('/support'),
  updateTicket: (id, data) => api.put(`/support/${id}`, data),
};

export { default as notificationService } from './notificationService';
