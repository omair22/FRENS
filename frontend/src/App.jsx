import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Toast from './components/Toast'

// Pages
import Feed from './pages/Feed'
import Onboarding from './pages/Onboarding'
import NewHangout from './pages/NewHangout'
import HangoutDetail from './pages/HangoutDetail'
import Album from './pages/Album'
import Nearby from './pages/Nearby'
import Profile from './pages/Profile'
import Frens from './pages/Frens'

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
  const { user, setUser, toast, setToast } = useStore()

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

  return (
    <Router>
      <div className="min-h-screen bg-background text-white selection:bg-primary-red/30">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewHangout /></ProtectedRoute>} />
          <Route path="/hangout/:id" element={<ProtectedRoute><HangoutDetail /></ProtectedRoute>} />
          <Route path="/album/:id" element={<ProtectedRoute><Album /></ProtectedRoute>} />
          <Route path="/nearby" element={<ProtectedRoute><Nearby /></ProtectedRoute>} />
          <Route path="/frens" element={<ProtectedRoute><Frens /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
        
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </Router>
  )
}

export default App
