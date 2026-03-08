import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      frens: [],
      hangouts: [],
      availability: {},
      toast: null, // { message, type }
      
      setUser: (user) => set({ user }),
      setFrens: (frens) => set({ frens }),
      setHangouts: (hangouts) => set({ hangouts }),
      setAvailability: (availability) => set({ availability }),
      setToast: (toast) => {
        set({ toast })
        if (toast) {
          // Auto-clear toast after 3s
          setTimeout(() => set({ toast: null }), 3000)
        }
      },
      
      updateHangoutRsvp: (hangoutId, rsvp) => set((state) => ({
        hangouts: state.hangouts.map((h) => 
          h.id === hangoutId ? { ...h, userRsvp: rsvp } : h
        )
      })),
    }),
    {
      name: 'frens-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
