// 认证状态管理
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  phone?: string
  nickname: string
  userType: 'CONSUMER' | 'BUSINESS' | 'ADMIN'
  companyName?: string
  avatar?: string
  points: number
  level: number
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => {
        set({ token })
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
        }
      },

      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// 认证工具函数
export const authUtils = {
  // 检查是否已登录
  isLoggedIn: () => {
    const { isAuthenticated } = useAuthStore.getState()
    return isAuthenticated
  },

  // 获取当前用户
  getCurrentUser: () => {
    const { user } = useAuthStore.getState()
    return user
  },

  // 获取用户类型
  getUserType: () => {
    const { user } = useAuthStore.getState()
    return user?.userType
  },

  // 检查是否为企业用户
  isBusinessUser: () => {
    const { user } = useAuthStore.getState()
    return user?.userType === 'BUSINESS'
  },

  // 检查是否为管理员
  isAdmin: () => {
    const { user } = useAuthStore.getState()
    return user?.userType === 'ADMIN'
  },

  // 获取认证token
  getToken: () => {
    const { token } = useAuthStore.getState()
    return token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
  },

  // 检查权限
  hasPermission: (requiredType: 'CONSUMER' | 'BUSINESS' | 'ADMIN') => {
    const { user } = useAuthStore.getState()
    if (!user) return false

    const typeHierarchy = {
      'CONSUMER': 1,
      'BUSINESS': 2,
      'ADMIN': 3,
    }

    return typeHierarchy[user.userType] >= typeHierarchy[requiredType]
  },
}

// React Hook for authentication
export const useAuth = () => {
  const authState = useAuthStore()
  
  return {
    ...authState,
    ...authUtils,
  }
}
