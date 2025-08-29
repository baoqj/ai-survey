'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Phone, ArrowRight, Github, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [loginType, setLoginType] = useState<'email' | 'phone'>('email')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    verificationCode: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usePasswordLogin, setUsePasswordLogin] = useState(true)
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
    setIsLoading(true)

    try {
      const loginData: any = {}

      // 根据登录类型设置数据
      if (loginType === 'email') {
        loginData.email = formData.email
      } else {
        loginData.phone = formData.phone
      }

      // 根据登录方式设置密码或验证码
      if (usePasswordLogin) {
        loginData.password = formData.password
      } else {
        loginData.verificationCode = formData.verificationCode
      }

      const response = await authAPI.login(loginData)

      if (response.success) {
        // 登录成功
        login(response.user, response.token)

        // 根据用户类型跳转
        if (response.user.userType === 'BUSINESS' || response.user.userType === 'ADMIN') {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      }
    } catch (error: any) {
      setError(error.message || '登录失败，请检查您的凭据')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = () => {
    // TODO: 发送验证码逻辑
    console.log('发送验证码到:', loginType === 'email' ? formData.email : formData.phone)
    alert('验证码已发送！')
  }

  const handleThirdPartyLogin = (provider: string) => {
    // TODO: 第三方登录逻辑
    console.log('第三方登录:', provider)
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-600">登录您的智问数研账户</p>
        </div>

        <Card className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 登录方式切换 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'email'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              邮箱登录
            </button>
            <button
              type="button"
              onClick={() => setLoginType('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'phone'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="h-4 w-4 inline mr-2" />
              手机登录
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱/手机号输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {loginType === 'email' ? '邮箱地址' : '手机号码'}
              </label>
              <div className="relative">
                {loginType === 'email' ? (
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                ) : (
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                )}
                <input
                  type={loginType === 'email' ? 'email' : 'tel'}
                  name={loginType}
                  value={loginType === 'email' ? formData.email : formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={loginType === 'email' ? '请输入邮箱地址' : '请输入手机号码'}
                  required
                />
              </div>
            </div>

            {/* 密码/验证码登录切换 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={usePasswordLogin}
                    onChange={() => setUsePasswordLogin(true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">密码登录</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!usePasswordLogin}
                    onChange={() => setUsePasswordLogin(false)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">验证码登录</span>
                </label>
              </div>
            </div>

            {/* 密码输入 */}
            {usePasswordLogin ? (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请输入密码"
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
            ) : (
              /* 验证码输入 */
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                  验证码
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="verificationCode"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请输入验证码"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    className="whitespace-nowrap"
                  >
                    发送验证码
                  </Button>
                </div>
              </div>
            )}

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">记住我</span>
              </label>
              {usePasswordLogin && (
                <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                  忘记密码？
                </Link>
              )}
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '立即登录'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* 第三方登录 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用以下方式登录</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleThirdPartyLogin('github')}
                className="w-full"
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleThirdPartyLogin('google')}
                className="w-full"
              >
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              还没有账户？
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                立即注册
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
