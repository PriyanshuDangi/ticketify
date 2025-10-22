import { create } from 'zustand';

const useTicketsStore = create((set) => ({
  // State
  myTickets: [],
  loading: false,
  error: null,
  purchaseStatus: {
    step: null, // 'created' | 'blockchain_added' | 'calendar_added'
    ticketId: null,
    transactionHash: null,
  },

  // Actions
  setMyTickets: (tickets) => set({ myTickets: tickets }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setPurchaseStatus: (status) => set((state) => ({
    purchaseStatus: { ...state.purchaseStatus, ...status }
  })),
  
  addTicket: (ticket) => set((state) => ({
    myTickets: [ticket, ...state.myTickets]
  })),
  
  updateTicket: (ticketId, updates) => set((state) => ({
    myTickets: state.myTickets.map((t) =>
      t._id === ticketId ? { ...t, ...updates } : t
    )
  })),
  
  resetPurchaseStatus: () => set({
    purchaseStatus: {
      step: null,
      ticketId: null,
      transactionHash: null,
    }
  }),
  
  reset: () => set({
    myTickets: [],
    loading: false,
    error: null,
    purchaseStatus: {
      step: null,
      ticketId: null,
      transactionHash: null,
    },
  }),
}));

export { useTicketsStore };

