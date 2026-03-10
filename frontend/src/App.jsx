import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import { getUnreadCount } from './lib/api'
import { getNotifConfig } from './lib/notifConfig'
import Toast from './components/Toast'

// Pages
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

// Components
import BottomNav from './components/BottomNav'

const ProtectedRoute = ({ children }) => {
  const user = useStore((state) => state.user)
  if (!user) return <Navigate to="/onboarding" replace />
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

  useEffect(() => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user)
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  // Poll unread notification count every 30s
  useEffect(() => {
    if (!user) return

    const fetchCount = async () => {
      try {
        const res = await getUnreadCount()
        setUnreadCount(res.data.count)
      } catch { }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user, setUnreadCount])

  // Supabase realtime: instant notification toast
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const cfg = getNotifConfig(payload.new.type)
          setToast({ message: `${cfg.icon} ${payload.new.title}`, type: 'info' })
          incrementUnread()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, setToast, incrementUnread])

  return (
    <Router>
      <div className="min-h-screen bg-background text-white selection:bg-primary-red/30">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewHangout /></ProtectedRoute>} />
          <Route path="/hangout/:id" element={<ProtectedRoute><HangoutDetail /></ProtectedRoute>} />
          <Route path="/hangout/:id/edit" element={<ProtectedRoute><NewHangout /></ProtectedRoute>} />
          <Route path="/nearby" element={<ProtectedRoute><Nearby /></ProtectedRoute>} />
          <Route path="/frens" element={<ProtectedRoute><Frens /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><FrenProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Routes>

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </Router>
  )
}

export default App
