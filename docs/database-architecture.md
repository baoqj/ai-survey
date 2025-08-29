# 数据库架构设计

## 技术选型
- **数据库**: Supabase (PostgreSQL)
- **特性**: Row-Level Security (RLS)
- **实时功能**: Supabase Realtime
- **存储**: Supabase Storage (文件上传)

## 数据库表结构

### 1. 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- 索引
  CONSTRAINT users_phone_check CHECK (phone ~ '^1[3-9]\d{9}$')
);

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. 问卷表 (surveys)
```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  max_responses INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{
    "allowAnonymous": true,
    "requireLogin": false,
    "showProgress": true,
    "allowBack": true
  }'
);

-- 创建索引
CREATE INDEX idx_surveys_active ON surveys(is_active);
CREATE INDEX idx_surveys_public ON surveys(is_public);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);
```

### 3. 题目表 (questions)
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'single_choice',
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 题目配置
  config JSONB DEFAULT '{}',
  
  -- 约束
  CONSTRAINT questions_type_check CHECK (
    question_type IN ('single_choice', 'multiple_choice', 'text', 'rating', 'matrix')
  ),
  CONSTRAINT questions_order_unique UNIQUE (survey_id, order_index)
);

-- 创建索引
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_questions_order ON questions(survey_id, order_index);
```

### 4. 选项表 (options)
```sql
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label VARCHAR(500) NOT NULL,
  value VARCHAR(100),
  score INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 选项配置
  config JSONB DEFAULT '{}',
  
  -- 约束
  CONSTRAINT options_order_unique UNIQUE (question_id, order_index)
);

-- 创建索引
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_options_order ON options(question_id, order_index);
```

### 5. 答题记录表 (responses)
```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  session_id VARCHAR(100), -- 匿名用户会话ID
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  completion_time INTEGER, -- 完成时间（秒）
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  -- 约束
  CONSTRAINT responses_user_or_session CHECK (
    user_id IS NOT NULL OR session_id IS NOT NULL
  )
);

-- 创建索引
CREATE INDEX idx_responses_user_id ON responses(user_id);
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_responses_session_id ON responses(session_id);
CREATE INDEX idx_responses_completed_at ON responses(completed_at);
```

### 6. 答案表 (answers)
```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  text_value TEXT, -- 文本题答案
  numeric_value NUMERIC, -- 数值题答案
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束：每个问题在一次答题中只能有一个答案
  CONSTRAINT answers_unique_per_question UNIQUE (response_id, question_id)
);

-- 创建索引
CREATE INDEX idx_answers_response_id ON answers(response_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_option_id ON answers(option_id);
```

### 7. AI分析结果表 (ai_analyses)
```sql
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) DEFAULT 'risk_assessment',
  language VARCHAR(10) DEFAULT 'zh',
  
  -- AI分析结果
  risk_scores JSONB NOT NULL DEFAULT '{}', -- 各维度风险评分
  summary TEXT, -- 分析摘要
  suggestions JSONB DEFAULT '[]', -- 建议列表
  confidence NUMERIC(3,2) DEFAULT 0.0, -- 置信度 0-1
  
  -- 处理信息
  ai_model VARCHAR(100), -- 使用的AI模型
  processing_time INTEGER, -- 处理时间（毫秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT ai_analyses_confidence_check CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT ai_analyses_language_check CHECK (language IN ('zh', 'en'))
);

-- 创建索引
CREATE INDEX idx_ai_analyses_response_id ON ai_analyses(response_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_ai_analyses_created_at ON ai_analyses(created_at);
```

### 8. 系统配置表 (system_configs)
```sql
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- 是否可公开访问
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_configs (key, value, description, is_public) VALUES
('ai_settings', '{"default_model": "huggingface", "timeout": 30000}', 'AI服务配置', false),
('ui_settings', '{"theme": "purple", "brand_name": "CRS Check"}', 'UI配置', true),
('survey_settings', '{"max_questions": 50, "max_options": 10}', '问卷限制配置', false);
```

## 数据库视图

### 1. 问卷统计视图
```sql
CREATE VIEW survey_statistics AS
SELECT 
  s.id,
  s.title,
  s.created_at,
  COUNT(DISTINCT r.id) as total_responses,
  COUNT(DISTINCT CASE WHEN r.is_completed THEN r.id END) as completed_responses,
  ROUND(
    COUNT(DISTINCT CASE WHEN r.is_completed THEN r.id END)::numeric / 
    NULLIF(COUNT(DISTINCT r.id), 0) * 100, 2
  ) as completion_rate,
  AVG(r.completion_time) as avg_completion_time
FROM surveys s
LEFT JOIN responses r ON s.id = r.survey_id
WHERE s.is_active = true
GROUP BY s.id, s.title, s.created_at;
```

### 2. 用户活动视图
```sql
CREATE VIEW user_activity AS
SELECT 
  u.id,
  u.name,
  u.phone,
  u.created_at as registered_at,
  COUNT(DISTINCT r.id) as total_responses,
  COUNT(DISTINCT CASE WHEN r.is_completed THEN r.id END) as completed_responses,
  MAX(r.completed_at) as last_activity
FROM users u
LEFT JOIN responses r ON u.id = r.user_id
GROUP BY u.id, u.name, u.phone, u.created_at;
```

## Row-Level Security (RLS) 策略

### 1. 用户表安全策略
```sql
-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的信息
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 2. 问卷表安全策略
```sql
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- 公开问卷所有人可查看
CREATE POLICY "Public surveys are viewable by everyone" ON surveys
  FOR SELECT USING (is_public = true AND is_active = true);

-- 创建者可以管理自己的问卷
CREATE POLICY "Users can manage own surveys" ON surveys
  FOR ALL USING (auth.uid() = created_by);
```

### 3. 答题记录安全策略
```sql
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的答题记录
CREATE POLICY "Users can view own responses" ON responses
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建答题记录
CREATE POLICY "Users can create responses" ON responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 数据库函数

### 1. 计算问卷完成率
```sql
CREATE OR REPLACE FUNCTION calculate_completion_rate(survey_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_responses INTEGER;
  completed_responses INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_responses
  FROM responses WHERE survey_id = survey_uuid;
  
  SELECT COUNT(*) INTO completed_responses
  FROM responses WHERE survey_id = survey_uuid AND is_completed = true;
  
  IF total_responses = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_responses::NUMERIC / total_responses) * 100, 2);
END;
$$ LANGUAGE plpgsql;
```

### 2. 获取问卷详细统计
```sql
CREATE OR REPLACE FUNCTION get_survey_detailed_stats(survey_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'survey_id', survey_uuid,
    'total_responses', COUNT(DISTINCT r.id),
    'completed_responses', COUNT(DISTINCT CASE WHEN r.is_completed THEN r.id END),
    'completion_rate', calculate_completion_rate(survey_uuid),
    'avg_completion_time', AVG(r.completion_time),
    'question_stats', (
      SELECT json_agg(
        json_build_object(
          'question_id', q.id,
          'content', q.content,
          'response_count', COUNT(a.id),
          'option_stats', (
            SELECT json_agg(
              json_build_object(
                'option_id', o.id,
                'label', o.label,
                'count', COUNT(a2.id),
                'percentage', ROUND(COUNT(a2.id)::NUMERIC / NULLIF(COUNT(a.id), 0) * 100, 2)
              )
            )
            FROM options o
            LEFT JOIN answers a2 ON o.id = a2.option_id
            WHERE o.question_id = q.id
            GROUP BY o.id, o.label
          )
        )
      )
      FROM questions q
      LEFT JOIN answers a ON q.id = a.question_id
      LEFT JOIN responses r2 ON a.response_id = r2.id
      WHERE q.survey_id = survey_uuid AND r2.is_completed = true
      GROUP BY q.id, q.content, q.order_index
      ORDER BY q.order_index
    )
  ) INTO result
  FROM responses r
  WHERE r.survey_id = survey_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## 数据库触发器

### 1. 自动更新时间戳
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到相关表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. 自动计算完成时间
```sql
CREATE OR REPLACE FUNCTION calculate_completion_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = NOW();
    NEW.completion_time = EXTRACT(EPOCH FROM (NOW() - NEW.started_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_completion_time BEFORE UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION calculate_completion_time();
```
