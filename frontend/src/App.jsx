import React, { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import { getUnreadCount } from './lib/api'
import { getNotifConfig } from './lib/notifConfig'
import Toast from './components/Toast'

import Feed from './pages/Feed'
import Onboarding from './pages/Onboarding'
import NewHangout from './pages/NewHangout'
import HangoutDetail from './pages/HangoutDetail'
import Nearby from './pages/Nearby'
import Profile from './pages/Profile'
import FrenProfile from './pages/FrenProfile'
import Frens from './pages/Frens'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import BottomNav from './components/BottomNav'

const ProtectedRoute = ({ children, authLoading }) => {
  const user = useStore((state) => state.user)

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
    </div>
  )

  if (!user?.name) return <Navigate to="/onboarding" replace />

  return (
    <>
      <div className="pb-32 min-h-screen bg-background">
        {children}
      </div>
      <BottomNav />
    </>
  )
}

function App() {
  const { user, setUser, toast, setToast, setUnreadCount, incrementUnread } = useStore()
  const [authLoading, setAuthLoading] = useState(true)
  const userRef = useRef(user)

  // Keep ref in sync with latest user state
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    const handleAuth = async (sessionUser, options = { showLoader: false }) => {
      if (options.showLoader) setAuthLoading(true)

      try {
        let { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle()

        if (error) throw error

        // If no row exists, create one
        if (!profile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: sessionUser.id,
              email: sessionUser.email,
              name: null,
              status: 'free',
              avatar_config: {}
            })
            .select()
            .single()

          if (insertError) throw insertError
          profile = newProfile
        }

        setUser({ ...sessionUser, ...profile })

        // If fully onboarded but still on onboarding page, go to feed
        const isFullyOnboarded = !!profile.name?.trim()
        if (isFullyOnboarded) {
          if (window.location.pathname.includes('onboarding')) {
            window.location.replace('/')
          }
        } else {
          // Just go to onboarding — it will figure out the step
          if (!window.location.pathname.includes('onboarding')) {
            window.location.replace('/onboarding')
          }
        }
      } catch (err) {
        console.error('[App] Auth error:', err.message)
      } finally {
        setAuthLoading(false)
      }
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await handleAuth(session.user, { showLoader: true })
      } else {
        setUser(null)
        setAuthLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // These events need no action
        if (event === 'TOKEN_REFRESHED') return
        if (event === 'INITIAL_SESSION') return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthLoading(false)
          return
        }

        if (session?.user) {
          const isSameUser = userRef.current?.id === session.user.id
          const isStable = isSameUser && !!userRef.current?.name

          // Already have this user with complete profile — no action needed
          if (isStable) {
            setAuthLoading(false)
            return
          }

          // New sign in or incomplete profile
          handleAuth(session.user, { showLoader: !isSameUser })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser]) // ← intentionally omit `user` to prevent re-subscription loop

  // Poll unread notification count every 30s
  useEffect(() => {
    if (!user?.name) return
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount()
        if (res?.data) setUnreadCount(res.data.count)
      } catch { }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user?.name, setUnreadCount])

  // Realtime notification toasts
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const cfg = getNotifConfig(payload.new.type)
        setToast({ message: `${cfg.icon} ${payload.new.title}`, type: 'info' })
        incrementUnread()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id, setToast, incrementUnread])

  return (
    <Router>
      <div className="min-h-screen bg-background text-white selection:bg-primary-red/30">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<ProtectedRoute authLoading={authLoading}><Feed /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute authLoading={authLoading}><NewHangout /></ProtectedRoute>} />
          <Route path="/hangout/:id" element={<ProtectedRoute authLoading={authLoading}><HangoutDetail /></ProtectedRoute>} />
          <Route path="/hangout/:id/edit" element={<ProtectedRoute authLoading={authLoading}><NewHangout /></ProtectedRoute>} />
          <Route path="/nearby" element={<ProtectedRoute authLoading={authLoading}><Nearby /></ProtectedRoute>} />
          <Route path="/frens" element={<ProtectedRoute authLoading={authLoading}><Frens /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute authLoading={authLoading}><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute authLoading={authLoading}><FrenProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute authLoading={authLoading}><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute authLoading={authLoading}><Notifications /></ProtectedRoute>} />
        </Routes>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </Router>
  )
}

export default App