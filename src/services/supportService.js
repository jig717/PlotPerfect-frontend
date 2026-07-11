import api from './api';

const API = "/support";

const getAllTickets = () => api.get(API);

const updateTicket = (id, data) => api.put(`${API}/${id}`, data);

const createTicket = (data) => api.post(API, data);

export const supportService = {
  getAllTickets,
  updateTicket,
  createTicket, 
};