import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  _id: string
  name: string
  email: string
  phoneNumber: string
  googleId?: string
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, phoneNumber: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post('/api/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null 
          })
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Login failed', 
            isLoading: false 
          })
          throw error
        }
      },

      signup: async (name: string, email: string, password: string, phoneNumber: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post('/api/auth/signup', { 
            name, 
            email, 
            password, 
            phoneNumber 
          })
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null 
          })
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Signup failed', 
            isLoading: false 
          })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        axios.post('/api/auth/logout')
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) return

        try {
          const response = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          set({ user: response.data.user, error: null })
        } catch (error) {
          set({ user: null, token: null, error: null })
        }
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
)