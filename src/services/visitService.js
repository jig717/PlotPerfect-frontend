import api from "./api";

const normalizeScheduledDate = (value) => {
  const parsedDate = value ? new Date(value) : null;
  return parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toISOString()
    : value;
};

const buildVisitCreatePayloads = (data = {}) => {
  const propertyId = data.propertyId || data.property || data.property_id || null;
  const agentId = data.agentId || data.agent_id || data.ownerId || data.owner_id || null;
  const scheduledDate = normalizeScheduledDate(data.scheduledDate || data.scheduled_date || null);
  const notes = typeof data.notes === "string" ? data.notes.trim() : "";

  const minimalCamel = {
    ...(propertyId ? { propertyId } : {}),
    ...(agentId ? { agentId } : {}),
    ...(scheduledDate ? { scheduledDate } : {}),
    ...(notes ? { notes } : {}),
  };

  const minimalSnake = {
    ...(propertyId ? { property: propertyId } : {}),
    ...(agentId ? { agent_id: agentId } : {}),
    ...(scheduledDate ? { scheduled_date: scheduledDate } : {}),
    ...(notes ? { notes } : {}),
  };

  const hybrid = {
    ...(propertyId ? { propertyId, property: propertyId } : {}),
    ...(agentId ? { agentId, agent_id: agentId } : {}),
    ...(scheduledDate ? { scheduledDate, scheduled_date: scheduledDate } : {}),
    ...(notes ? { notes } : {}),
  };

  return [minimalCamel, minimalSnake, hybrid].filter((payload) => Object.keys(payload).length > 0);
};

const isValidationFailure = (error) => {
  const status = error?.response?.status;
  return status === 400 || status === 422;
};

const createVisit = async (data) => {
  const payloads = buildVisitCreatePayloads(data);
  let lastError;

  for (const payload of payloads) {
    try {
      return await api.post("/visits", payload, { timeout: 30000 });
    } catch (error) {
      lastError = error;
      if (!isValidationFailure(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};

const visitService = {
  create: createVisit,
  getBuyerVisits: (params) => api.get("/visits/buyer", { params }),
  getAgentVisits: (params) => api.get("/visits/agent", { params }),
  update: (id, data) => api.put(`/visits/${id}`, data),
  updateStatus: (id, status) => api.patch(`/visits/${id}/status`, { status }),
};

export default visitService;
