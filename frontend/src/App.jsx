import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import PrivateRoute from './router/PrivateRoute'
import OrganizerRoute from './router/OrganizerRoute'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Feed from './pages/events/Feed'
import EventDetail from './pages/events/EventDetail'
import CreateEvent from './pages/events/CreateEvent'
import EditEvent from './pages/events/EditEvent'
import Cabinet from './pages/cabinet/Cabinet'
import MyTickets from './pages/cabinet/MyTickets'
import Favorites from './pages/cabinet/Favorites'
import Friends from './pages/cabinet/Friends'
import Dashboard from './pages/dashboard/Dashboard'
import MockCheckout from './pages/payments/MockCheckout'
import NotFound from './pages/NotFound'

export default function App() {
  const { init, loading } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<Feed />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/private/:token" element={<EventDetail isPrivate />} />

        <Route element={<PrivateRoute />}>
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/:id/edit" element={<EditEvent />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/cabinet/tickets" element={<MyTickets />} />
          <Route path="/cabinet/favorites" element={<Favorites />} />
          <Route path="/cabinet/friends" element={<Friends />} />
          <Route path="/mock-checkout/:paymentId" element={<MockCheckout />} />
        </Route>

        <Route element={<OrganizerRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
