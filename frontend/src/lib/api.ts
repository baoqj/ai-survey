// API 服务层 - 与后端API通信
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// 通用API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// 认证API
export const authAPI = {
  // 用户注册
  register: async (userData: {
    email: string
    phone: string
    password: string
    nickname: string
    userType: 'CONSUMER' | 'BUSINESS'
    companyName?: string
    inviteCode?: string
  }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // 用户登录
  login: async (credentials: {
    email?: string
    phone?: string
    password?: string
    verificationCode?: string
  }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  // 获取用户资料
  getProfile: async () => {
    return apiRequest('/users/profile')
  },

  // 更新用户资料
  updateProfile: async (profileData: any) => {
    return apiRequest('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    })
  },
}

// 问卷API
export const surveyAPI = {
  // 获取问卷列表
  getSurveys: async (params?: {
    page?: number
    limit?: number
    category?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/surveys${query ? `?${query}` : ''}`)
  },

  // 获取单个问卷
  getSurvey: async (id: string) => {
    return apiRequest(`/surveys/${id}`)
  },

  // 创建问卷
  createSurvey: async (surveyData: {
    title: string
    description?: string
    questions: any[]
    category?: string
    accessType?: 'PUBLIC' | 'PRIVATE' | 'PASSWORD' | 'INVITE'
    password?: string
  }) => {
    return apiRequest('/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData),
    })
  },

  // 更新问卷
  updateSurvey: async (id: string, surveyData: any) => {
    return apiRequest(`/surveys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(surveyData),
    })
  },

  // 删除问卷
  deleteSurvey: async (id: string) => {
    return apiRequest(`/surveys/${id}`, {
      method: 'DELETE',
    })
  },

  // 提交答卷
  submitResponse: async (surveyId: string, responseData: {
    answers: Record<string, any>
    isAnonymous?: boolean
  }) => {
    return apiRequest(`/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify(responseData),
    })
  },

  // 获取问卷回答
  getResponses: async (surveyId: string, params?: {
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/surveys/${surveyId}/responses${query ? `?${query}` : ''}`)
  },
}

// AI服务API
export const aiAPI = {
  // AI问卷生成建议
  generateSurvey: async (prompt: string) => {
    return apiRequest('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    })
  },

  // AI答卷分析
  analyzeResponses: async (surveyId: string) => {
    return apiRequest('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ surveyId }),
    })
  },
}

// 模板API
export const templateAPI = {
  // 获取模板列表
  getTemplates: async (params?: {
    page?: number
    limit?: number
    category?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/templates${query ? `?${query}` : ''}`)
  },

  // 购买模板
  purchaseTemplate: async (templateId: string) => {
    return apiRequest(`/templates/${templateId}/purchase`, {
      method: 'POST',
    })
  },
}

// 积分API
export const pointsAPI = {
  // 获取积分交易记录
  getTransactions: async (params?: {
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/points/transactions${query ? `?${query}` : ''}`)
  },

  // 获取积分规则
  getRules: async () => {
    return apiRequest('/points/rules')
  },
}

// 仪表板API
export const dashboardAPI = {
  // 获取统计数据
  getStats: async () => {
    return apiRequest('/dashboard/stats')
  },
}

// 管理员API
export const adminAPI = {
  // 获取用户列表
  getUsers: async (params?: {
    page?: number
    limit?: number
    userType?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`)
  },

  // 获取系统统计
  getSystemStats: async () => {
    return apiRequest('/admin/stats')
  },
}

// 健康检查API
export const healthAPI = {
  check: async () => {
    return apiRequest('/health')
  },
}
