import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function OrganizerRoute() {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!['organizer', 'admin'].includes(user?.role)) return <Navigate to="/events" replace />
  return <Outlet />
}
