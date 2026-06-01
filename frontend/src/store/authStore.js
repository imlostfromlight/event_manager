import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('access')
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const { data } = await api.get('/auth/me/')
      set({ user: data, isAuthenticated: true, loading: false })
    } catch {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    set({ user: data.user, isAuthenticated: true })
    return data.user
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register/', payload)
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    set({ user: data.user, isAuthenticated: true })
    return data.user
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh')
    try {
      await api.post('/auth/logout/', { refresh })
    } catch {}
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    set({ user: null, isAuthenticated: false })
  },

  updateUser: (userData) => set({ user: { ...get().user, ...userData } }),
}))

export default useAuthStore
