import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Layouts
import Layout from './components/Layout'
import AuthLayout from './components/AuthLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import ChittiGroups from './pages/ChittiGroups'
import GroupDetails from './pages/GroupDetails'
import Members from './pages/Members'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  const { user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <AuthLayout><LoginPage /></AuthLayout>
          } />
          <Route path="/signup" element={
            user ? <Navigate to="/dashboard" /> : <AuthLayout><SignupPage /></AuthLayout>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />
          } />
          <Route path="/groups" element={
            user ? <Layout><ChittiGroups /></Layout> : <Navigate to="/login" />
          } />
          <Route path="/groups/:groupId" element={
            user ? <Layout><GroupDetails /></Layout> : <Navigate to="/login" />
          } />
          <Route path="/members" element={
            user ? <Layout><Members /></Layout> : <Navigate to="/login" />
          } />
          <Route path="/notifications" element={
            user ? <Layout><Notifications /></Layout> : <Navigate to="/login" />
          } />
          <Route path="/reports" element={
            user ? <Layout><Reports /></Layout> : <Navigate to="/login" />
          } />
          <Route path="/settings" element={
            user ? <Layout><Settings /></Layout> : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App