import { create } from 'zustand';

const useEventsStore = create((set) => ({
  // State
  events: [],
  selectedEvent: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    upcoming: true,
    minPrice: null,
    maxPrice: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  // Actions
  setEvents: (events) => set({ events }),
  
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events]
  })),
  
  updateEvent: (eventId, updates) => set((state) => ({
    events: state.events.map((e) => 
      e._id === eventId ? { ...e, ...updates } : e
    ),
    selectedEvent: state.selectedEvent?._id === eventId 
      ? { ...state.selectedEvent, ...updates }
      : state.selectedEvent
  })),
  
  removeEvent: (eventId) => set((state) => ({
    events: state.events.filter((e) => e._id !== eventId),
    selectedEvent: state.selectedEvent?._id === eventId ? null : state.selectedEvent
  })),
  
  reset: () => set({
    events: [],
    selectedEvent: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      upcoming: true,
      minPrice: null,
      maxPrice: null,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  }),
}));

export { useEventsStore };

