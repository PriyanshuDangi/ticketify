import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      wallet: null,

      // Actions
      setUser: (user) => set({ user }),
      
      setWallet: (wallet) => set({ wallet, isAuthenticated: !!wallet }),
      
      login: (user, wallet) => set({ 
        user, 
        wallet,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        wallet: null,
        isAuthenticated: false 
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'ticketify-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };

