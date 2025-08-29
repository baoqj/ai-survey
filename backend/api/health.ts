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

  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      message: '智问数研AI智能问卷调研系统后端服务运行正常',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'backend-api'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
