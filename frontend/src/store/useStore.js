import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      frens: [],
      hangouts: [],
      availability: {},
      toast: null,
      pendingRequestCount: 0,
      unreadCount: 0,
      
      setUser: (user) => set({ user }),
      setFrens: (frens) => set({ frens }),
      setHangouts: (hangouts) => set({ hangouts }),
      setAvailability: (availability) => set({ availability }),
      setPendingRequestCount: (pendingRequestCount) => set({ pendingRequestCount }),
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      incrementUnread: () => set(state => ({ unreadCount: state.unreadCount + 1 })),
      
      activeFab: null,
      setActiveFab: (activeFab) => set({ activeFab }),
      setToast: (toast) => {
        set({ toast })
        if (toast) {
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
