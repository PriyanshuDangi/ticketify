import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      wallet: null,

      // Actions
      setUser: (user) => set({ user }),
      
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setWallet: (wallet) => set({ wallet }),
      
      login: (user, token, wallet) => set({ 
        user, 
        token, 
        wallet,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
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
        token: state.token,
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

