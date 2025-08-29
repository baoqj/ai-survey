import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { action, data } = req.body || {};

    switch (action) {
      case 'generate_survey':
        // AI生成问卷
        const { topic, target_audience, question_count } = data || {};
        
        if (!topic) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '缺少必需参数',
              details: [{ field: 'topic', message: '问卷主题不能为空' }]
            }
          });
          return;
        }

        // 模拟AI生成的问卷
        const generatedSurvey = {
          title: `${topic}调研问卷`,
          description: `关于${topic}的专业调研，帮助我们更好地了解您的需求和体验。`,
          questions: [
            {
              id: '1',
              type: 'single_choice',
              title: `您对${topic}的整体满意度如何？`,
              options: ['非常满意', '满意', '一般', '不满意', '非常不满意'],
              required: true
            },
            {
              id: '2',
              type: 'multiple_choice',
              title: `您认为${topic}最需要改进的方面有哪些？`,
              options: ['功能完善', '用户体验', '性能优化', '价格合理', '客户服务'],
              required: false
            },
            {
              id: '3',
              type: 'text',
              title: `请详细描述您对${topic}的建议或意见`,
              placeholder: '请输入您的建议...',
              required: false
            }
          ]
        };

        res.status(200).json({
          success: true,
          data: {
            survey: generatedSurvey,
            generation_info: {
              model: 'AI-Survey-Generator-v1.0',
              confidence: 0.95,
              processing_time: '2.3s'
            }
          },
          message: 'AI问卷生成成功'
        });
        break;

      case 'analyze_response':
        // AI分析答卷
        const { survey_id, response_data } = data || {};
        
        if (!survey_id || !response_data) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '缺少必需参数'
            }
          });
          return;
        }

        // 模拟AI分析结果
        const analysis = {
          overall_score: 8.5,
          sentiment: 'positive',
          key_insights: [
            '用户对产品整体满意度较高',
            '主要关注点集中在功能完善和用户体验',
            '建议优先改进用户界面设计'
          ],
          tags: ['满意', '功能需求', '体验优化'],
          confidence: 0.92
        };

        res.status(200).json({
          success: true,
          data: {
            analysis,
            processing_info: {
              model: 'AI-Response-Analyzer-v1.0',
              processing_time: '1.8s'
            }
          },
          message: 'AI答卷分析完成'
        });
        break;

      default:
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: '不支持的AI操作类型'
          }
        });
    }
  } else {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '不支持的请求方法'
      }
    });
  }
}
