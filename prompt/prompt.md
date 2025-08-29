你是一位全栈开发助手，构建一个支持多问卷管理、移动优先、自适应交互的调查问卷系统，并通过AI能力（LLM）生成个性化反馈报告，提升用户体验与数据价值。系统采用模块化架构，便于维护与拓展，支持快速部署与跨平台使用。
使用 Next.js + Tailwind CSS + TypeScript 开发一个移动优先的问卷调查系统，数据与逻辑完全解耦，使用 RESTful API 与数据库通信。

# 前端功能需求
1. 页面布局：
   - 首页（Landing）展示：Logo + 项目名称“CRS Check” + 介绍语 + “立即开始自测”按钮，点击跳转至问卷页面。
   - 问卷页面：
     - 每页展示一题（单选）。
     - 显示当前题号“QUESTION {i} OF {total}”
     - 显示题目内容与所有选项。
     - 底部导航包含“上一题 ←”与“下一题 →”按钮。
     - 所有页面按钮使用圆角与品牌紫色主题（#7C3AED）。
   - 档案建立页：两个输入框（姓名 + 手机号） + “建档并自测”按钮。
   - 结果页面：
     - 使用雷达图展示五维风险（金融账户、控制人、结构、合规、税务）。
     - 逐条展示分析与建议（图文排版参考最后一张截图）。
   - UI 风格：纯移动端适配，参考微信小程序风格，简洁流畅，字体适中。

2. 路由规则：
   - `/` 首页
   - `/survey?surveyId=xxx` 问卷答题页
   - `/result?surveyId=xxx&userId=xxx` 答题结果页，个性化分析报告页（图表 + 建议文本）
   - `/profile` 用户建档页（填写姓名/手机号）
   - `/admin` 管理后台

3. 动效与交互：
   - 单题页面切换动画（左右滑动切换）
   - 未选中选项点击“下一题”时给出提示
   - 题目加载采用懒加载方式
   - 使用本地缓存实现问卷答题中断续答功能

# 后台功能需求
1. 管理后台 `/admin`（登录验证可选）：
   - 问卷管理：
     - 新建问卷（填写标题、题目、选项、选项分值）
     - 编辑 / 删除已有问卷
   - 数据统计：
     - 按问卷查看答题用户总数、完成率
     - 查看每题统计柱状图（每个选项的答题人数）
     - 查看某用户答题详情及其风险分析报告
   - 仪表板：
     `/admin/dashboard` 总体答题统计、热力图、问卷完成情况
   - 问卷管理：
     `/admin/surveys` 问卷增删改查（题目/选项配置）
   - 答题结果管理：
     `/admin/answers` 答题记录浏览（按问卷/用户查询）

2. 技术要求：
   - 前端框架：Next.js 15 + Tailwind CSS
   - 状态管理：React Context / Zustand
   - 数据存储：MongoDB / Firebase（任选其一）
   - API：RESTful（GET / POST / PUT / DELETE）
   - 图表库：Radar图使用 Chart.js 或 Recharts
   - 项目部署：Vercel（生产）+ localhost（开发）



# AI能力嵌入建议
- 用户完成问卷后，将其答题选项以结构化数据提交至后端
- 后端将答案及用户基本信息作为 Prompt 调用 LLM（使用huggingface API）
- AI返回一段“个性化分析报告”文本，包括：
    - 风险分析（如结构复杂度、身份穿透）
    - 建议改进点（补充申报、信息透明）
- 分析报告支持多语言（中英文）切换与本地化控制

# 数据库设计建议
1. collections:
   - `surveys`: { id, title, questions: [{ question, options: [text, score] }] }
   - `responses`: { userId, surveyId, answers: [optionIndex], timestamp }
   - `users`: { id, name, phone }
   - `results`: { responseId, analysis: { riskArea: score, ... }, suggestions: [text] }
2. 数据结构（Supabase）表结构概览
    - users: id, name, phone, created_at
    - surveys: id, title, description
    - questions: id, survey_id, order, content
    - options: id, question_id, label, score
    - responses: id, user_id, survey_id, created_at
    - answers: id, response_id, question_id, option_id
    - feedbacks: id, response_id, ai_summary, ai_score_json

# 部署流程（Vercel）
- 前端通过 Next.js 构建，使用 vercel.json 配置 edge function 加速
- 环境变量配置：
    - SUPABASE_URL
    - SUPABASE_KEY
    - OPENAI_API_KEY（或其他 AI 提供商）

# 主要特性总结
- 支持多个问卷并可动态创建、配置题目与选- 
- 支持单题页答题，滑动顺畅，移动端体验极- 
- 提交后自动生成 AI 风险分析与合规建- 
- 后台支持可视化统计、单题分析、答题记录查- 
- 数据结构清晰，支持后续拓展如问卷打分、个性推送- 
- Vercel 一键部署，Supabase 无服务器高效存储

请你按模块逐步生成代码。