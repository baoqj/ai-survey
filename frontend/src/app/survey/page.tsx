'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { surveyAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Question {
  id: string
  type: 'single' | 'multiple' | 'text'
  title: string
  options?: string[]
  required: boolean
}

export default function SurveyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [surveyData, setSurveyData] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 获取问卷ID（从URL参数或预览数据）
  const surveyId = searchParams.get('id')
  const isPreview = searchParams.get('preview') === 'true'

  // 获取问卷数据
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setIsLoading(true)

        if (isPreview) {
          // 预览模式：从sessionStorage获取数据
          const previewData = sessionStorage.getItem('preview_survey')
          if (previewData) {
            setSurveyData(JSON.parse(previewData))
          } else {
            throw new Error('预览数据不存在')
          }
        } else if (surveyId) {
          // 正常模式：从API获取问卷数据
          const response = await surveyAPI.getSurvey(surveyId)
          if (response.success) {
            setSurveyData(response.data)
          } else {
            throw new Error('问卷不存在或已关闭')
          }
        } else {
          // 使用示例问卷数据
          setSurveyData({
            id: 'sample',
            title: '产品满意度调研',
            description: '我们希望了解您对我们产品的真实感受',
            questions: [
              {
                id: '1',
                type: 'single',
                title: '您对我们的产品整体满意度如何？',
                options: ['非常满意', '满意', '一般', '不满意', '非常不满意'],
                required: true,
              },
              {
                id: '2',
                type: 'multiple',
                title: '您最看重产品的哪些方面？（可多选）',
                options: ['功能性', '易用性', '价格', '客户服务', '品牌声誉'],
                required: true,
              },
              {
                id: '3',
                type: 'text',
                title: '您还有什么建议或意见吗？',
                required: false,
              },
            ]
          })
        }
      } catch (error: any) {
        setError(error.message || '获取问卷数据失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurveyData()
  }, [surveyId, isPreview])

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNext = () => {
    const questions = surveyData?.questions || []
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setIsCompleted(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (isPreview) {
      alert('这是预览模式，答案不会被保存')
      return
    }

    if (!surveyData?.id || surveyData.id === 'sample') {
      alert('这是示例问卷，答案不会被保存')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const responseData = {
        answers,
        isAnonymous: !user // 如果用户未登录，则为匿名提交
      }

      const response = await surveyAPI.submitResponse(surveyData.id, responseData)

      if (response.success) {
        alert('问卷提交成功！感谢您的参与。')
        // 可以跳转到感谢页面或返回首页
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message || '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div>
        <Navigation showHomeButton={true} title="问卷调研" />
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载问卷中...</p>
          </div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div>
        <Navigation showHomeButton={true} title="问卷调研" />
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重新加载</Button>
          </div>
        </div>
      </div>
    )
  }

  // 没有问卷数据
  if (!surveyData) {
    return (
      <div>
        <Navigation showHomeButton={true} title="问卷调研" />
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">问卷不存在</p>
            <Button onClick={() => router.push('/')}>返回首页</Button>
          </div>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div>
        <Navigation showHomeButton={true} title="问卷调研" />
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                问卷完成！
              </h2>
              <p className="text-gray-600 mb-6">
                感谢您的参与，您的反馈对我们非常重要。
              </p>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交问卷'}
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  const questions = surveyData?.questions || []
  const question = questions[currentQuestion]
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <div>
      <Navigation showBackButton={true} title="问卷调研" />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                问题 {currentQuestion + 1} / {questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% 完成
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-primary-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h2>

              <div className="space-y-4">
                {question.type === 'single' && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswer(question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'multiple' && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={answers[question.id]?.includes(option) || false}
                          onChange={(e) => {
                            const currentAnswers = answers[question.id] || []
                            if (e.target.checked) {
                              handleAnswer(question.id, [...currentAnswers, option])
                            } else {
                              handleAnswer(question.id, currentAnswers.filter((a: string) => a !== option))
                            }
                          }}
                          className="mr-3"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'text' && (
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                    placeholder="请输入您的答案..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                  />
                )}
              </div>
            </Card>
          </motion.div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              上一题
            </Button>

            <Button onClick={handleNext}>
              {currentQuestion === questions.length - 1 ? '完成' : '下一题'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
