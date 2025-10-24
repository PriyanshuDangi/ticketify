import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - wallet address cookie missing or invalid
      // Show reconnect wallet message
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const apiClient = {
  // Health check
  health: () => api.get('/health'),

  // Events
  getEvents: (params) => api.get('/api/events', { params }),
  getEvent: (id) => api.get(`/api/events/${id}`),
  createEvent: (data) => api.post('/api/events', data),
  updateEvent: (id, data) => api.put(`/api/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/api/events/${id}`),
  getMyEvents: (params) => api.get('/api/events/my-events', { params }),

  // Tickets
  purchaseTicket: (data) => api.post('/api/tickets/purchase', data),
  confirmTicket: (data) => api.post('/api/tickets/confirm', data),
  getMyTickets: (params) => api.get('/api/tickets/my-tickets', { params }),
  getEventTickets: (eventId, params) => api.get(`/api/tickets/event/${eventId}`, { params }),

  // Users
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data) => api.put('/api/users/me', data),
  connectGoogle: () => api.get('/api/users/connect-google'),
  isGoogleCalendarConnected: () => api.get('/api/users/is-google-calendar-connected'),
  googleCallback: (code) => api.get('/api/users/google-callback', { params: { code } }),
  
  // Event Contract ID
  updateEventContractId: (id, contractEventId) => api.patch(`/api/events/${id}/contract-id`, { contractEventId }),
};

