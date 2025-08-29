// 智问数研AI智能问卷调研系统 - 后端服务
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;

// 简单的JSON响应函数
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  }));
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // 路由处理
  if (path === '/api/health' && method === 'GET') {
    sendJSON(res, 200, {
      status: 'OK',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      message: '智问数研AI智能问卷调研系统后端服务运行中',
      services: {
        database: 'OK',
        ai: 'OK'
      }
    });
  } else if (path === '/api/surveys' && method === 'GET') {
    sendJSON(res, 200, {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
      message: '问卷列表接口 - 开发中'
    });
  } else if (path === '/api/users/profile' && method === 'GET') {
    sendJSON(res, 200, {
      data: {
        id: 'demo-user',
        nickname: '演示用户',
        email: 'demo@example.com',
        user_type: 'consumer',
        points: 100,
        level: 1,
        profile: {
          age: 25,
          gender: 'male',
          location: 'Beijing'
        }
      },
      message: '用户信息接口 - 开发中'
    });
  } else if (path === '/api/responses' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        sendJSON(res, 201, {
          data: {
            id: 'demo-response-' + Date.now(),
            survey_id: data.survey_id || 'demo-survey',
            status: 'completed',
            completed_at: new Date().toISOString()
          },
          message: '答卷提交成功'
        });
      } catch (error) {
        sendJSON(res, 400, {
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body'
          }
        });
      }
    });
  } else if (path === '/api/ai/generate-survey' && method === 'POST') {
    sendJSON(res, 200, {
      data: {
        title: 'AI生成的问卷',
        description: '这是一个由AI生成的示例问卷',
        questions: [
          {
            id: 'q1',
            content: '您对我们的服务满意吗？',
            type: 'single_choice',
            options: [
              { label: '非常满意', value: '5' },
              { label: '满意', value: '4' },
              { label: '一般', value: '3' },
              { label: '不满意', value: '2' },
              { label: '非常不满意', value: '1' }
            ]
          }
        ]
      },
      message: 'AI问卷生成接口 - 开发中'
    });
  } else {
    // 404处理
    sendJSON(res, 404, {
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found'
      },
      path: path
    });
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 智问数研AI智能问卷调研系统后端服务启动成功！`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API地址: http://localhost:${PORT}/api`);
  console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📊 问卷接口: http://localhost:${PORT}/api/surveys`);
  console.log(`👤 用户接口: http://localhost:${PORT}/api/users/profile`);
  console.log(`📝 答卷接口: http://localhost:${PORT}/api/responses`);
  console.log(`🤖 AI接口: http://localhost:${PORT}/api/ai/generate-survey`);
});
