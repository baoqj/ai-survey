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

  switch (req.method) {
    case 'GET':
      // 获取问卷列表
      res.status(200).json({
        success: true,
        data: {
          surveys: [
            {
              id: '1',
              title: '用户体验调研问卷',
              description: '帮助我们了解您的使用体验',
              status: 'active',
              questions_count: 10,
              responses_count: 25,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              title: '产品满意度调查',
              description: '您对我们产品的满意度如何？',
              status: 'active',
              questions_count: 8,
              responses_count: 42,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        },
        message: '获取问卷列表成功'
      });
      break;

    case 'POST':
      // 创建问卷
      const { title, description, questions } = req.body || {};
      
      if (!title || !description) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必需参数',
            details: [
              { field: 'title', message: '问卷标题不能为空' },
              { field: 'description', message: '问卷描述不能为空' }
            ]
          }
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          survey: {
            id: Date.now().toString(),
            title,
            description,
            status: 'draft',
            questions_count: questions ? questions.length : 0,
            responses_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        message: '问卷创建成功'
      });
      break;

    default:
      res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '不支持的请求方法'
        }
      });
  }
}
