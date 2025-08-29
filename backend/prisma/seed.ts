import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始数据库种子数据初始化...')

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@survey.aibao.me' },
    update: {},
    create: {
      email: 'admin@survey.aibao.me',
      password_hash: adminPassword,
      nickname: '系统管理员',
      user_type: 'ADMIN',
      status: 'ACTIVE',
      points: 10000,
      level: 10,
      email_verified: true,
      profile: {
        create: {
          location: '北京',
          occupation: '系统管理员'
        }
      }
    }
  })
  console.log('✅ 管理员用户创建完成:', admin.email)

  // 创建企业用户示例
  const businessPassword = await bcrypt.hash('business123', 12)
  const businessUser = await prisma.user.upsert({
    where: { email: 'business@example.com' },
    update: {},
    create: {
      email: 'business@example.com',
      password_hash: businessPassword,
      nickname: '企业用户示例',
      user_type: 'BUSINESS',
      status: 'ACTIVE',
      points: 1000,
      level: 3,
      email_verified: true,
      profile: {
        create: {
          age: 35,
          gender: 'MALE',
          location: '上海',
          occupation: '产品经理',
          education: '本科'
        }
      }
    }
  })
  console.log('✅ 企业用户创建完成:', businessUser.email)

  // 创建普通用户示例
  const consumerPassword = await bcrypt.hash('consumer123', 12)
  const consumerUser = await prisma.user.upsert({
    where: { email: 'consumer@example.com' },
    update: {},
    create: {
      email: 'consumer@example.com',
      password_hash: consumerPassword,
      nickname: '普通用户示例',
      user_type: 'CONSUMER',
      status: 'ACTIVE',
      points: 500,
      level: 2,
      email_verified: true,
      profile: {
        create: {
          age: 28,
          gender: 'FEMALE',
          location: '深圳',
          occupation: '设计师',
          education: '本科',
          interests: {
            categories: ['设计', '科技', '旅行'],
            hobbies: ['摄影', '阅读', '运动']
          }
        }
      }
    }
  })
  console.log('✅ 普通用户创建完成:', consumerUser.email)

  // 创建示例问卷
  const sampleSurvey = await prisma.survey.create({
    data: {
      creator_id: businessUser.id,
      title: '用户体验满意度调研',
      description: '我们希望了解您对我们产品的使用体验，您的反馈对我们非常重要。',
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          content: '您对我们的产品整体满意度如何？',
          required: true,
          options: [
            { label: '非常满意', value: '5', score: 100 },
            { label: '满意', value: '4', score: 80 },
            { label: '一般', value: '3', score: 60 },
            { label: '不满意', value: '2', score: 40 },
            { label: '非常不满意', value: '1', score: 20 }
          ]
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          content: '您最喜欢我们产品的哪些功能？（可多选）',
          required: false,
          options: [
            { label: '界面设计', value: 'ui', score: 20 },
            { label: '功能丰富', value: 'features', score: 20 },
            { label: '操作简单', value: 'usability', score: 20 },
            { label: '响应速度', value: 'performance', score: 20 },
            { label: '客户服务', value: 'support', score: 20 }
          ]
        },
        {
          id: 'q3',
          type: 'text',
          content: '您还有什么建议或意见吗？',
          required: false
        }
      ],
      config: {
        allowAnonymous: true,
        requireLogin: false,
        showProgress: true,
        allowBack: true,
        randomizeQuestions: false
      },
      status: 'PUBLISHED',
      access_type: 'PUBLIC',
      category: '用户体验',
      tags: ['满意度', '用户体验', '产品反馈'],
      published_at: new Date()
    }
  })
  console.log('✅ 示例问卷创建完成:', sampleSurvey.title)

  // 创建示例答卷
  const sampleResponse = await prisma.response.create({
    data: {
      survey_id: sampleSurvey.id,
      respondent_id: consumerUser.id,
      answers: [
        {
          question_id: 'q1',
          answer_type: 'single_choice',
          choice_values: ['4']
        },
        {
          question_id: 'q2',
          answer_type: 'multiple_choice',
          choice_values: ['ui', 'usability']
        },
        {
          question_id: 'q3',
          answer_type: 'text',
          text_value: '整体体验不错，希望能增加更多个性化设置选项。'
        }
      ],
      metadata: {
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ip_address: '127.0.0.1',
        submitted_from: 'web'
      },
      quality_score: 'GREEN',
      completion_rate: 1.0,
      time_spent: 180,
      status: 'COMPLETED',
      is_anonymous: false,
      started_at: new Date(Date.now() - 180000),
      completed_at: new Date()
    }
  })
  console.log('✅ 示例答卷创建完成:', sampleResponse.id)

  // 更新问卷响应计数
  await prisma.survey.update({
    where: { id: sampleSurvey.id },
    data: { response_count: 1 }
  })

  // 创建积分规则
  const pointRules = [
    {
      rule_name: 'survey_complete',
      rule_type: 'EARN' as const,
      action: 'survey_complete',
      points: 20,
      conditions: { min_questions: 3 },
      daily_limit: 200,
      total_limit: null
    },
    {
      rule_name: 'survey_create',
      rule_type: 'EARN' as const,
      action: 'survey_create',
      points: 50,
      conditions: { min_questions: 5 },
      daily_limit: 500,
      total_limit: null
    },
    {
      rule_name: 'daily_login',
      rule_type: 'EARN' as const,
      action: 'daily_login',
      points: 5,
      conditions: {},
      daily_limit: 5,
      total_limit: null
    },
    {
      rule_name: 'template_purchase',
      rule_type: 'SPEND' as const,
      action: 'template_purchase',
      points: 100,
      conditions: {},
      daily_limit: null,
      total_limit: null
    }
  ]

  for (const rule of pointRules) {
    await prisma.pointRule.upsert({
      where: { rule_name: rule.rule_name },
      update: {},
      create: rule
    })
  }
  console.log('✅ 积分规则创建完成')

  // 创建积分交易记录
  await prisma.pointTransaction.create({
    data: {
      user_id: consumerUser.id,
      type: 'EARN',
      amount: 20,
      balance_after: 520,
      source: 'survey_complete',
      reference_id: sampleResponse.id,
      reference_type: 'response',
      description: '完成问卷调研获得积分'
    }
  })

  await prisma.pointTransaction.create({
    data: {
      user_id: businessUser.id,
      type: 'EARN',
      amount: 50,
      balance_after: 1050,
      source: 'survey_create',
      reference_id: sampleSurvey.id,
      reference_type: 'survey',
      description: '创建问卷获得积分'
    }
  })
  console.log('✅ 积分交易记录创建完成')

  // 创建问卷模板
  const surveyTemplate = await prisma.surveyTemplate.create({
    data: {
      creator_id: admin.id,
      title: '客户满意度调研模板',
      description: '通用的客户满意度调研问卷模板，适用于各种行业',
      questions: [
        {
          id: 'q1',
          type: 'rating',
          content: '请为我们的服务打分（1-10分）',
          required: true,
          options: [
            { label: '1分', value: '1', score: 10 },
            { label: '2分', value: '2', score: 20 },
            { label: '3分', value: '3', score: 30 },
            { label: '4分', value: '4', score: 40 },
            { label: '5分', value: '5', score: 50 },
            { label: '6分', value: '6', score: 60 },
            { label: '7分', value: '7', score: 70 },
            { label: '8分', value: '8', score: 80 },
            { label: '9分', value: '9', score: 90 },
            { label: '10分', value: '10', score: 100 }
          ]
        },
        {
          id: 'q2',
          type: 'single_choice',
          content: '您会向朋友推荐我们的服务吗？',
          required: true,
          options: [
            { label: '非常愿意', value: 'very_likely', score: 100 },
            { label: '愿意', value: 'likely', score: 75 },
            { label: '可能', value: 'maybe', score: 50 },
            { label: '不太愿意', value: 'unlikely', score: 25 },
            { label: '绝对不会', value: 'never', score: 0 }
          ]
        }
      ],
      category: '客户满意度',
      tags: ['满意度', '客户反馈', '服务质量'],
      price: 0,
      is_public: true,
      status: 'ACTIVE'
    }
  })
  console.log('✅ 问卷模板创建完成:', surveyTemplate.title)

  console.log('🎉 数据库种子数据初始化完成！')
  console.log('\n📋 创建的测试账号：')
  console.log('管理员: admin@survey.aibao.me / admin123456')
  console.log('企业用户: business@example.com / business123')
  console.log('普通用户: consumer@example.com / consumer123')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
