'use client'

import React, { useState } from 'react'
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

// 模拟数据
const dashboardData = {
  overview: {
    totalSurveys: 24,
    totalResponses: 1847,
    activeUsers: 342,
    completionRate: 78.5
  },
  recentSurveys: [
    {
      id: '1',
      title: '产品满意度调研',
      status: 'active',
      responses: 156,
      completionRate: 82.3,
      createdAt: '2024-08-25',
      lastResponse: '2小时前'
    },
    {
      id: '2', 
      title: '用户体验反馈收集',
      status: 'active',
      responses: 89,
      completionRate: 75.6,
      createdAt: '2024-08-23',
      lastResponse: '1天前'
    },
    {
      id: '3',
      title: '市场调研问卷',
      status: 'draft',
      responses: 0,
      completionRate: 0,
      createdAt: '2024-08-22',
      lastResponse: '从未'
    }
  ],
  aiInsights: [
    {
      type: 'trend',
      title: '用户满意度呈上升趋势',
      description: '过去30天内，用户满意度评分平均提升了12%，主要体现在产品功能和客户服务方面。',
      confidence: 'high'
    },
    {
      type: 'anomaly',
      title: '发现异常回答模式',
      description: '检测到3份问卷存在可能的机器人回答，建议启用验证码功能。',
      confidence: 'medium'
    },
    {
      type: 'suggestion',
      title: '优化建议',
      description: '建议在问卷中增加开放性问题，以获得更深入的用户反馈。',
      confidence: 'high'
    }
  ]
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('30d')

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
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.totalSurveys}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.totalResponses.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.activeUsers}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.completionRate}%</p>
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
                  {dashboardData.recentSurveys.map((survey, index) => (
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
                            {survey.responses} 回答
                          </span>
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {survey.completionRate}% 完成率
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {survey.lastResponse}
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
                  {dashboardData.aiInsights.map((insight, index) => (
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
