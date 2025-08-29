'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Phone, User, Building, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    userType: 'CONSUMER' as 'CONSUMER' | 'BUSINESS',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    companyName: '',
    inviteCode: '',
    agreeTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 表单验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 8) {
      setError('密码长度至少8位')
      return
    }

    if (!formData.agreeTerms) {
      setError('请同意用户协议和隐私政策')
      return
    }

    setIsLoading(true)

    try {
      const registerData = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        nickname: formData.nickname,
        userType: formData.userType,
        ...(formData.userType === 'BUSINESS' && { companyName: formData.companyName }),
        ...(formData.inviteCode && { inviteCode: formData.inviteCode }),
      }

      const response = await authAPI.register(registerData)

      if (response.success) {
        // 注册成功，自动登录
        login(response.user, response.token)

        // 根据用户类型跳转
        if (formData.userType === 'BUSINESS') {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      }
    } catch (error: any) {
      setError(error.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">智研</span>
            </div>
            <span className="text-xl font-bold text-gray-900">智问数研</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">创建账户</h1>
          <p className="text-gray-600">加入智问数研，开启智能调研之旅</p>
        </div>

        <Card className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户类型选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">账户类型</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.userType === 'CONSUMER' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="userType"
                    value="CONSUMER"
                    checked={formData.userType === 'CONSUMER'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <User className="h-5 w-5 mr-2 text-primary-600" />
                  <span className="text-sm font-medium">个人用户</span>
                </label>
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.userType === 'BUSINESS' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="userType"
                    value="BUSINESS"
                    checked={formData.userType === 'BUSINESS'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <Building className="h-5 w-5 mr-2 text-primary-600" />
                  <span className="text-sm font-medium">企业用户</span>
                </label>
              </div>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
            </div>

            {/* 手机号 */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                手机号码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入手机号码"
                  required
                />
              </div>
            </div>

            {/* 昵称 */}
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium text-gray-700">
                {formData.userType === 'BUSINESS' ? '联系人姓名' : '昵称'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={formData.userType === 'BUSINESS' ? '请输入联系人姓名' : '请输入昵称'}
                required
              />
            </div>

            {/* 企业名称（仅企业用户显示） */}
            {formData.userType === 'BUSINESS' && (
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  企业名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入企业名称"
                  required
                />
              </div>
            )}

            {/* 密码 */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入密码（至少8位）"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请再次输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 邀请码（可选） */}
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="text-sm font-medium text-gray-700">
                邀请码（可选）
              </label>
              <input
                type="text"
                id="inviteCode"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入邀请码（可获得额外积分）"
              />
            </div>

            {/* 同意条款 */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                我已阅读并同意
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 mx-1">
                  《用户协议》
                </Link>
                和
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700 mx-1">
                  《隐私政策》
                </Link>
              </label>
            </div>

            {/* 注册按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.agreeTerms}
            >
              {isLoading ? '注册中...' : '立即注册'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账户？
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                立即登录
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
