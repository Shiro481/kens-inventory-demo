import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'
import Login from './pages/Auth/Login'
import { supabase } from './lib/supabase'
import ToastContainer from './components/Toast/Toast'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'dashboard'>('home')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for existing session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const handleAccessRequest = () => {
    if (user) {
      setCurrentPage('dashboard')
    } else {
      setCurrentPage('login')
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
      setCurrentPage('home')
    }
  }

  return (
    <>
      {currentPage === 'home' && (
        <Home onAccessDashboard={handleAccessRequest} />
      )}
      
      {currentPage === 'login' && !user && (
        <Login 
          onBack={() => setCurrentPage('home')} 
          onSuccess={(user) => {
            setUser(user)
            setCurrentPage('dashboard')
          }} 
        />
      )}

      {(currentPage === 'dashboard' || (currentPage === 'login' && user)) && (
        <Dashboard onGoToHome={() => setCurrentPage('home')} onLogout={handleLogout} />
      )}

      {/* Global toast notifications — rendered above everything */}
      <ToastContainer />
    </>
  )
}

export default App
