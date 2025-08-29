'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Eye,
  Download,
  Calendar,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { dashboardAPI, surveyAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth'

  // 如果正在加载或没有认证，显示加载状态
  if (isLoading || !isAuthenticated) {
    return (
      <div>
        <Navigation showHomeButton={true} title="数据仪表板" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div>
        <Navigation showHomeButton={true} title="数据仪表板" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重试</Button>
          </div>
        </div>
      </div>
    )
  }

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [timeRange, setTimeRange] = useState('30d')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [recentSurveys, setRecentSurveys] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 检查用户权限
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.userType !== 'BUSINESS' && user?.userType !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [isAuthenticated, user, router])

  // 获取仪表板数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return

      try {
        setIsLoading(true)

        // 并行获取数据
        const [statsResponse, surveysResponse] = await Promise.all([
          dashboardAPI.getStats(),
          surveyAPI.getSurveys({ limit: 5 })
        ])

        setDashboardData(statsResponse.data)
        setRecentSurveys(surveysResponse.data.surveys || [])
      } catch (error: any) {
        setError(error.message || '获取数据失败')
        console.error('Dashboard data fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated, timeRange])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'draft':
        return 'text-yellow-600 bg-yellow-100'
      case 'closed':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'draft':
        return '草稿'
      case 'closed':
        return '已结束'
      default:
        return '未知'
    }
  }

  return (
    <div>
      <Navigation showHomeButton={true} title="数据仪表板" />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题和操作 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">数据仪表板</h1>
              <p className="text-gray-600 mt-1">实时监控您的问卷数据和AI分析洞察</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="90d">最近90天</option>
              </select>
              <Button onClick={() => window.location.href = '/dashboard/create'}>
                <Plus className="h-4 w-4 mr-2" />
                创建问卷
              </Button>
            </div>
          </div>

          {/* 数据概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">问卷总数</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.totalSurveys || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12%</span>
                  <span className="text-gray-500 ml-1">较上月</span>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总回答数</p>
                    <p className="text-2xl font-bold text-gray-900">{(dashboardData?.totalResponses || 0).toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+23%</span>
                  <span className="text-gray-500 ml-1">较上月</span>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">活跃用户</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.activeUsers || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+8%</span>
                  <span className="text-gray-500 ml-1">较上月</span>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">完成率</p>
                    <p className="text-2xl font-bold text-gray-900">{(dashboardData?.completionRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+5%</span>
                  <span className="text-gray-500 ml-1">较上月</span>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 最近问卷 */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">最近问卷</h2>
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {recentSurveys.map((survey, index) => (
                    <motion.div
                      key={survey.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{survey.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(survey.status)}`}>
                            {getStatusText(survey.status)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {survey.responseCount || 0} 回答
                          </span>
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {((survey.responseCount || 0) > 0 ? ((survey.responseCount || 0) / (survey.targetCount || 100) * 100) : 0).toFixed(1)}% 完成率
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {survey.updatedAt ? new Date(survey.updatedAt).toLocaleDateString() : '从未'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          导出
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            {/* AI分析洞察 */}
            <div>
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <Zap className="h-5 w-5 text-primary-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">AI分析洞察</h2>
                </div>
                
                <div className="space-y-4">
                  {(dashboardData?.aiInsights || []).map((insight: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{insight.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          insight.confidence === 'high' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {insight.confidence === 'high' ? '高置信度' : '中置信度'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                    </motion.div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4">
                  查看更多洞察
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
