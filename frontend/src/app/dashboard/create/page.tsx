'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wand2, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  Eye,
  Settings,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'

interface Question {
  id: string
  type: 'single' | 'multiple' | 'text' | 'rating'
  title: string
  options?: string[]
  required: boolean
}

export default function CreateSurveyPage() {
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    category: '',
    questions: [] as Question[]
  })
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'template'>('ai')

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    
    // TODO: 调用AI生成API
    console.log('AI生成问卷:', aiPrompt)
    
    // 模拟AI生成结果
    setTimeout(() => {
      const generatedQuestions: Question[] = [
        {
          id: '1',
          type: 'single',
          title: '您对我们的产品整体满意度如何？',
          options: ['非常满意', '满意', '一般', '不满意', '非常不满意'],
          required: true
        },
        {
          id: '2',
          type: 'multiple',
          title: '您最看重产品的哪些方面？（可多选）',
          options: ['功能性', '易用性', '价格', '客户服务', '品牌声誉'],
          required: true
        },
        {
          id: '3',
          type: 'text',
          title: '您还有什么建议或意见吗？',
          required: false
        }
      ]
      
      setSurveyData(prev => ({
        ...prev,
        title: '产品满意度调研问卷',
        description: '我们希望了解您对我们产品的真实感受，您的反馈对我们非常重要。',
        questions: generatedQuestions
      }))
      setIsGenerating(false)
    }, 3000)
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'single',
      title: '',
      options: ['选项1', '选项2'],
      required: false
    }
    setSurveyData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    }))
  }

  const deleteQuestion = (id: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const handleSave = () => {
    // TODO: 保存问卷逻辑
    console.log('保存问卷:', surveyData)
    alert('问卷已保存为草稿！')
  }

  const handlePreview = () => {
    // TODO: 预览问卷逻辑
    console.log('预览问卷:', surveyData)
    window.open('/survey/preview', '_blank')
  }

  return (
    <div>
      <Navigation showBackButton={true} title="创建问卷" />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">创建问卷</h1>
            <p className="text-gray-600 mt-1">使用AI智能生成或手动创建您的专属问卷</p>
          </div>

          {/* 创建方式选择 */}
          <Card className="p-6 mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wand2 className="h-4 w-4 inline mr-2" />
                AI智能生成
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                手动创建
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'template'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                模板选择
              </button>
            </div>

            {/* AI生成界面 */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述您的调研需求
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="例如：我想了解用户对我们新产品的满意度，包括功能、价格、服务等方面的反馈..."
                  />
                </div>
                <Button
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      AI正在生成问卷...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI智能生成问卷
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 手动创建界面 */}
            {activeTab === 'manual' && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">手动创建问卷</h3>
                <p className="text-gray-600 mb-4">从零开始创建您的专属问卷</p>
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加第一个问题
                </Button>
              </div>
            )}

            {/* 模板选择界面 */}
            {activeTab === 'template' && (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择问卷模板</h3>
                <p className="text-gray-600 mb-4">从专业模板开始，快速创建问卷</p>
                <Button variant="outline">
                  浏览模板库
                </Button>
              </div>
            )}
          </Card>

          {/* 问卷基本信息 */}
          {(surveyData.title || surveyData.questions.length > 0) && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">问卷基本信息</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    问卷标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={surveyData.title}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请输入问卷标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    问卷描述
                  </label>
                  <textarea
                    value={surveyData.description}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="请输入问卷描述"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* 问题列表 */}
          {surveyData.questions.length > 0 && (
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">问题设计</h2>
                <Button variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加问题
                </Button>
              </div>
              
              <div className="space-y-4">
                {surveyData.questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-2">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, { type: e.target.value as Question['type'] })}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="single">单选题</option>
                            <option value="multiple">多选题</option>
                            <option value="text">文本题</option>
                            <option value="rating">评分题</option>
                          </select>
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                              className="mr-2"
                            />
                            必填
                          </label>
                        </div>
                        <input
                          type="text"
                          value={question.title}
                          onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="请输入问题标题"
                        />
                        {(question.type === 'single' || question.type === 'multiple') && (
                          <div className="space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || [])]
                                    newOptions[optionIndex] = e.target.value
                                    updateQuestion(question.id, { options: newOptions })
                                  }}
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder={`选项 ${optionIndex + 1}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = question.options?.filter((_, i) => i !== optionIndex)
                                    updateQuestion(question.id, { options: newOptions })
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [...(question.options || []), `选项 ${(question.options?.length || 0) + 1}`]
                                updateQuestion(question.id, { options: newOptions })
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              添加选项
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* 操作按钮 */}
          {(surveyData.title || surveyData.questions.length > 0) && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  保存草稿
                </Button>
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  预览
                </Button>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  发布设置
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
