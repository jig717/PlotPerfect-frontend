import api from './api';

export const notificationService = {
  getNotifications: async () => {
    return api.get('/notifications');
  },

  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return api.patch('/notifications/read-all');
  }
};

export default notificationService;
