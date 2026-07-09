import axios from "axios";

const API = "http://localhost:3400/api/support";

const getAllTickets = () =>
  axios.get(API, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

const updateTicket = (id, data) =>
  axios.put(`${API}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

const createTicket = (data) =>
  axios.post(API, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

export const supportService = {
  getAllTickets,
  updateTicket,
  createTicket, 
};