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
      // 获取用户列表或用户信息
      res.status(200).json({
        success: true,
        data: {
          users: [
            {
              id: '1',
              email: 'demo@example.com',
              nickname: '演示用户',
              user_type: 'consumer',
              created_at: new Date().toISOString()
            }
          ]
        },
        message: '获取用户信息成功'
      });
      break;

    case 'POST':
      // 创建用户
      const { email, password, nickname, user_type } = req.body || {};
      
      if (!email || !password || !nickname) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必需参数',
            details: [
              { field: 'email', message: '邮箱不能为空' },
              { field: 'password', message: '密码不能为空' },
              { field: 'nickname', message: '昵称不能为空' }
            ]
          }
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: Date.now().toString(),
            email,
            nickname,
            user_type: user_type || 'consumer',
            status: 'active',
            created_at: new Date().toISOString()
          }
        },
        message: '用户创建成功'
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
