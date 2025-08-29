'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Shield, Zap, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'AI智能生成',
      description: '基于RAG技术智能生成问卷，提供深度数据分析洞察',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: '数据价值最大化',
      description: '通过深度分析和智能标签系统挖掘数据潜在价值',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: '生态化运营',
      description: '构建内容市场和积分经济，形成良性循环',
    },
  ]

  const handleStartSurvey = () => {
    router.push('/survey')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">智研</span>
              </div>
              <span className="font-semibold text-gray-900">智问数研</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <div className="text-2xl font-bold text-primary-600">智研</div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-gradient">智问数研</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
              AI智能问卷调研系统
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              以AI驱动的智能问卷调研平台，为企业客户提供高效、智能的数据收集与分析解决方案，
              同时为C端用户创造有价值的参与体验
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <Button
              size="lg"
              onClick={handleStartSurvey}
              className="text-lg px-8 py-4 shadow-large hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              立即体验调研
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4 text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 bg-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              简单三步，智能调研
            </h2>
            <p className="text-lg text-gray-600">
              AI驱动的智能问卷调研流程，高效收集和分析数据
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '智能问卷',
                description: 'AI自动生成个性化问卷，或选择专业模板',
              },
              {
                step: '02',
                title: '数据收集',
                description: '高效收集用户反馈，实时统计分析',
              },
              {
                step: '03',
                title: '深度洞察',
                description: 'AI生成专业分析报告，挖掘数据价值',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 bg-gradient-to-r from-primary-600 to-primary-700"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold text-white mb-4">
              准备开始您的智能问卷调研了吗？
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              体验AI驱动的问卷调研平台，获得深度数据洞察和专业分析报告
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartSurvey}
              className="text-lg px-8 py-4 bg-white text-primary-600 hover:bg-gray-50"
            >
              开始调研
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-success-500" />
            <span>安全可靠</span>
            <span>•</span>
            <CheckCircle className="h-4 w-4 text-success-500" />
            <span>数据加密</span>
            <span>•</span>
            <CheckCircle className="h-4 w-4 text-success-500" />
            <span>隐私保护</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
