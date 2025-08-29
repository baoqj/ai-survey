# 智问数研 - API接口设计文档

## 文档信息
- **版本**: v1.0
- **编写日期**: 2025年8月
- **负责人**: 后端技术团队
- **API版本**: v1

## 1. 接口概述

### 1.1 基础信息
- **Base URL**: `https://api.quantiq.ai/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 认证方式
```http
Authorization: Bearer <access_token>
```

### 1.3 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200,
  "timestamp": "2025-08-28T10:00:00Z"
}
```

### 1.4 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2025-08-28T10:00:00Z"
}
```

## 2. 用户认证接口

### 2.1 用户注册
```http
POST /auth/register
```

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户昵称",
  "user_type": "consumer", // consumer | business
  "invite_code": "ABC123" // 可选
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "用户昵称",
      "user_type": "consumer",
      "status": "active",
      "created_at": "2025-08-28T10:00:00Z"
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_in": 3600
    }
  }
}
```

### 2.2 用户登录
```http
POST /auth/login
```

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2.3 刷新Token
```http
POST /auth/refresh
```

**请求参数**:
```json
{
  "refresh_token": "refresh_token"
}
```

### 2.4 用户登出
```http
POST /auth/logout
```

## 3. 用户管理接口

### 3.1 获取用户信息
```http
GET /users/profile
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "用户昵称",
    "avatar_url": "https://cdn.example.com/avatar.jpg",
    "user_type": "consumer",
    "points": 1000,
    "level": 3,
    "profile": {
      "age": 25,
      "gender": "male",
      "occupation": "工程师",
      "location": "北京"
    },
    "tags": ["技术爱好者", "活跃用户"],
    "created_at": "2025-08-28T10:00:00Z"
  }
}
```

### 3.2 更新用户信息
```http
PUT /users/profile
```

**请求参数**:
```json
{
  "nickname": "新昵称",
  "avatar_url": "https://cdn.example.com/new-avatar.jpg",
  "profile": {
    "age": 26,
    "gender": "male",
    "occupation": "高级工程师",
    "location": "上海"
  }
}
```

### 3.3 获取积分记录
```http
GET /users/points/transactions?page=1&limit=20
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "earn",
        "amount": 10,
        "source": "survey_complete",
        "description": "完成问卷调研",
        "created_at": "2025-08-28T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## 4. 问卷管理接口

### 4.1 创建问卷
```http
POST /surveys
```

**请求参数**:
```json
{
  "title": "用户满意度调研",
  "description": "了解用户对产品的满意度",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "title": "您对我们的产品满意吗？",
      "options": [
        {"id": "opt1", "text": "非常满意"},
        {"id": "opt2", "text": "满意"},
        {"id": "opt3", "text": "一般"},
        {"id": "opt4", "text": "不满意"}
      ],
      "required": true
    }
  ],
  "config": {
    "access_type": "public",
    "allow_anonymous": true,
    "max_responses": 1000
  }
}
```

### 4.2 AI生成问卷
```http
POST /surveys/generate
```

**请求参数**:
```json
{
  "prompt": "创建一份关于用户体验的问卷",
  "target_audience": "互联网用户",
  "question_count": 10,
  "include_types": ["single_choice", "multiple_choice", "text"]
}
```

### 4.3 获取问卷列表
```http
GET /surveys?page=1&limit=20&status=published&category=all
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": "uuid",
        "title": "用户满意度调研",
        "description": "了解用户对产品的满意度",
        "creator": {
          "id": "uuid",
          "nickname": "创建者昵称"
        },
        "status": "published",
        "response_count": 150,
        "created_at": "2025-08-28T10:00:00Z",
        "updated_at": "2025-08-28T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### 4.4 获取问卷详情
```http
GET /surveys/{survey_id}
```

### 4.5 更新问卷
```http
PUT /surveys/{survey_id}
```

### 4.6 删除问卷
```http
DELETE /surveys/{survey_id}
```

### 4.7 发布问卷
```http
POST /surveys/{survey_id}/publish
```

## 5. 答卷管理接口

### 5.1 提交答卷
```http
POST /surveys/{survey_id}/responses
```

**请求参数**:
```json
{
  "answers": [
    {
      "question_id": "q1",
      "answer": "opt1"
    },
    {
      "question_id": "q2",
      "answer": ["opt1", "opt3"]
    },
    {
      "question_id": "q3",
      "answer": "这是一个很好的产品"
    }
  ],
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1",
    "referrer": "https://example.com"
  }
}
```

### 5.2 获取答卷列表
```http
GET /surveys/{survey_id}/responses?page=1&limit=20
```

### 5.3 获取答卷详情
```http
GET /responses/{response_id}
```

### 5.4 AI分析答卷
```http
POST /responses/{response_id}/analyze
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "quality_score": "green",
      "completeness": 0.95,
      "consistency": 0.88,
      "insights": [
        "用户对产品整体满意度较高",
        "在功能易用性方面有改进空间"
      ],
      "tags": ["高质量回答", "详细反馈"],
      "sentiment": "positive"
    }
  }
}
```

## 6. 数据分析接口

### 6.1 获取问卷统计
```http
GET /surveys/{survey_id}/analytics
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_responses": 500,
      "completion_rate": 0.85,
      "average_time": 180,
      "last_response_at": "2025-08-28T10:00:00Z"
    },
    "demographics": {
      "age_distribution": {
        "18-25": 30,
        "26-35": 45,
        "36-45": 20,
        "46+": 5
      },
      "gender_distribution": {
        "male": 55,
        "female": 40,
        "other": 5
      }
    },
    "question_analytics": [
      {
        "question_id": "q1",
        "type": "single_choice",
        "responses": 500,
        "distribution": {
          "opt1": 200,
          "opt2": 150,
          "opt3": 100,
          "opt4": 50
        }
      }
    ]
  }
}
```

### 6.2 导出数据
```http
POST /surveys/{survey_id}/export
```

**请求参数**:
```json
{
  "format": "excel", // excel | csv | json
  "include_metadata": true,
  "date_range": {
    "start": "2025-08-01T00:00:00Z",
    "end": "2025-08-31T23:59:59Z"
  }
}
```

## 7. 内容市场接口

### 7.1 获取模板列表
```http
GET /marketplace/templates?category=survey&page=1&limit=20
```

### 7.2 购买模板
```http
POST /marketplace/templates/{template_id}/purchase
```

### 7.3 上传模板
```http
POST /marketplace/templates
```

## 8. AI服务接口

### 8.1 生成问卷建议
```http
POST /ai/survey/suggestions
```

### 8.2 分析文本情感
```http
POST /ai/text/sentiment
```

### 8.3 提取关键词
```http
POST /ai/text/keywords
```

## 9. 系统接口

### 9.1 健康检查
```http
GET /health
```

### 9.2 获取系统配置
```http
GET /config
```

## 10. 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| SUCCESS | 200 | 请求成功 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMITED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 11. 限流规则

- **普通用户**: 100请求/分钟
- **付费用户**: 500请求/分钟
- **企业用户**: 1000请求/分钟

---

**维护说明**: 本文档将随着API版本更新持续维护，请关注版本变更记录。
