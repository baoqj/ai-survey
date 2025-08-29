# 智问数研 - 数据库设计文档

## 文档信息
- **版本**: v1.0
- **编写日期**: 2025年8月
- **负责人**: 后端技术团队

## 1. 数据库概述

### 1.1 技术选型
- **主数据库**:  Supabase数据库


### 1.2 设计原则
- **规范化**: 遵循第三范式，避免数据冗余
- **性能优化**: 合理使用索引，优化查询性能
- **扩展性**: 支持水平分片和垂直分割
- **安全性**: 行级安全策略，数据加密存储

## 2. 核心表结构设计

### 2.1 用户相关表

#### 2.1.1 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    user_type VARCHAR(20) DEFAULT 'consumer' CHECK (user_type IN ('consumer', 'business', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type_status ON users(user_type, status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2.1.2 用户画像表 (user_profiles)
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age > 0 AND age < 150),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    occupation VARCHAR(100),
    education VARCHAR(50),
    location VARCHAR(100),
    interests JSONB,
    behavior_tags JSONB,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 索引
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_age ON user_profiles(age);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN(interests);
```

#### 2.1.3 用户标签表 (user_tags)
```sql
CREATE TABLE user_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_value VARCHAR(255),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(50) NOT NULL, -- 'system', 'manual', 'ai'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_name ON user_tags(tag_name);
CREATE INDEX idx_user_tags_source ON user_tags(source);
```

### 2.2 问卷相关表

#### 2.2.1 问卷表 (surveys)
```sql
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed')),
    access_type VARCHAR(20) DEFAULT 'public' CHECK (access_type IN ('public', 'private', 'password', 'invite')),
    access_code VARCHAR(50),
    max_responses INTEGER,
    response_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    seo_config JSONB,
    ai_generated BOOLEAN DEFAULT FALSE,
    template_id UUID,
    category VARCHAR(50),
    tags TEXT[],
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_surveys_creator_id ON surveys(creator_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_category ON surveys(category);
CREATE INDEX idx_surveys_published_at ON surveys(published_at);
CREATE INDEX idx_surveys_tags ON surveys USING GIN(tags);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);
```

#### 2.2.2 问卷模板表 (survey_templates)
```sql
CREATE TABLE survey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    tags TEXT[],
    price INTEGER DEFAULT 0, -- 积分价格
    is_public BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_survey_templates_creator_id ON survey_templates(creator_id);
CREATE INDEX idx_survey_templates_category ON survey_templates(category);
CREATE INDEX idx_survey_templates_price ON survey_templates(price);
CREATE INDEX idx_survey_templates_rating ON survey_templates(rating);
CREATE INDEX idx_survey_templates_tags ON survey_templates USING GIN(tags);
```

### 2.3 答卷相关表

#### 2.3.1 答卷表 (responses)
```sql
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    answers JSONB NOT NULL,
    metadata JSONB DEFAULT '{}', -- IP, User-Agent, 设备信息等
    ai_analysis JSONB, -- AI分析结果
    quality_score VARCHAR(10) CHECK (quality_score IN ('red', 'amber', 'green')),
    completion_rate DECIMAL(3,2) CHECK (completion_rate >= 0 AND completion_rate <= 1),
    time_spent INTEGER, -- 答题用时（秒）
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'invalid')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_responses_respondent_id ON responses(respondent_id);
CREATE INDEX idx_responses_quality_score ON responses(quality_score);
CREATE INDEX idx_responses_completed_at ON responses(completed_at);
CREATE INDEX idx_responses_answers ON responses USING GIN(answers);
```

#### 2.3.2 答卷分析表 (response_analytics)
```sql
CREATE TABLE response_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'sentiment', 'keywords', 'quality'
    analysis_result JSONB NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(response_id, analysis_type)
);

-- 索引
CREATE INDEX idx_response_analytics_response_id ON response_analytics(response_id);
CREATE INDEX idx_response_analytics_type ON response_analytics(analysis_type);
```

### 2.4 积分系统表

#### 2.4.1 积分交易表 (point_transactions)
```sql
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend', 'transfer', 'refund')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'survey_complete', 'referral', 'purchase'
    reference_id UUID, -- 关联的业务ID
    reference_type VARCHAR(50), -- 'survey', 'template', 'referral'
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_source ON point_transactions(source);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
```

#### 2.4.2 积分规则表 (point_rules)
```sql
CREATE TABLE point_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL, -- 'earn', 'spend'
    action VARCHAR(100) NOT NULL, -- 'survey_complete', 'daily_login'
    points INTEGER NOT NULL,
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    daily_limit INTEGER,
    total_limit INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_point_rules_action ON point_rules(action);
CREATE INDEX idx_point_rules_active ON point_rules(is_active);
```

### 2.5 内容市场表

#### 2.5.1 模板交易表 (template_purchases)
```sql
CREATE TABLE template_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'points', -- 'points', 'cash'
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(buyer_id, template_id)
);

-- 索引
CREATE INDEX idx_template_purchases_buyer_id ON template_purchases(buyer_id);
CREATE INDEX idx_template_purchases_template_id ON template_purchases(template_id);
CREATE INDEX idx_template_purchases_created_at ON template_purchases(created_at);
```

### 2.6 向量数据表

#### 2.6.1 问卷向量表 (survey_embeddings)
```sql
CREATE TABLE survey_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'title', 'description', 'questions'
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding维度
    model_name VARCHAR(100) DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 向量索引
CREATE INDEX ON survey_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 其他索引
CREATE INDEX idx_survey_embeddings_survey_id ON survey_embeddings(survey_id);
CREATE INDEX idx_survey_embeddings_content_type ON survey_embeddings(content_type);
```

#### 2.6.2 用户向量表 (user_embeddings)
```sql
CREATE TABLE user_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    embedding_type VARCHAR(50) NOT NULL, -- 'profile', 'behavior', 'preferences'
    embedding VECTOR(1536),
    model_name VARCHAR(100) DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, embedding_type)
);

-- 向量索引
CREATE INDEX ON user_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 其他索引
CREATE INDEX idx_user_embeddings_user_id ON user_embeddings(user_id);
CREATE INDEX idx_user_embeddings_type ON user_embeddings(embedding_type);
```

## 3. 视图和存储过程

### 3.1 常用视图

#### 3.1.1 用户统计视图
```sql
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.nickname,
    u.user_type,
    u.points,
    u.level,
    COUNT(DISTINCT s.id) as survey_count,
    COUNT(DISTINCT r.id) as response_count,
    u.created_at
FROM users u
LEFT JOIN surveys s ON u.id = s.creator_id AND s.status = 'published'
LEFT JOIN responses r ON u.id = r.respondent_id AND r.status = 'completed'
GROUP BY u.id, u.nickname, u.user_type, u.points, u.level, u.created_at;
```

#### 3.1.2 问卷统计视图
```sql
CREATE VIEW survey_stats AS
SELECT 
    s.id,
    s.title,
    s.status,
    s.response_count,
    s.view_count,
    AVG(CASE WHEN r.quality_score = 'green' THEN 3 
             WHEN r.quality_score = 'amber' THEN 2 
             WHEN r.quality_score = 'red' THEN 1 END) as avg_quality_score,
    AVG(r.completion_rate) as avg_completion_rate,
    AVG(r.time_spent) as avg_time_spent,
    s.created_at,
    s.published_at
FROM surveys s
LEFT JOIN responses r ON s.id = r.survey_id AND r.status = 'completed'
GROUP BY s.id, s.title, s.status, s.response_count, s.view_count, s.created_at, s.published_at;
```

### 3.2 存储过程

#### 3.2.1 更新用户积分
```sql
CREATE OR REPLACE FUNCTION update_user_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_type VARCHAR(20),
    p_source VARCHAR(100),
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- 获取当前积分余额
    SELECT points INTO current_balance FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- 计算新余额
    IF p_type = 'earn' THEN
        new_balance := current_balance + p_amount;
    ELSIF p_type = 'spend' THEN
        IF current_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient points';
        END IF;
        new_balance := current_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type';
    END IF;
    
    -- 更新用户积分
    UPDATE users SET points = new_balance, updated_at = NOW() WHERE id = p_user_id;
    
    -- 记录交易
    INSERT INTO point_transactions (
        user_id, type, amount, balance_after, source, 
        reference_id, reference_type, description
    ) VALUES (
        p_user_id, p_type, p_amount, new_balance, p_source,
        p_reference_id, p_reference_type, p_description
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## 4. 数据安全和权限

### 4.1 行级安全策略 (RLS)

#### 4.1.1 用户数据安全
```sql
-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY user_own_data ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY user_profile_own_data ON user_profiles
    FOR ALL USING (auth.uid() = user_id);
```

#### 4.1.2 问卷数据安全
```sql
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- 创建者可以访问自己的问卷
CREATE POLICY survey_creator_access ON surveys
    FOR ALL USING (auth.uid() = creator_id);

-- 公开问卷所有人可以查看
CREATE POLICY survey_public_read ON surveys
    FOR SELECT USING (status = 'published' AND access_type = 'public');
```

### 4.2 数据加密
- **敏感字段加密**: 使用pgcrypto扩展加密敏感数据
- **传输加密**: 强制使用SSL/TLS连接
- **备份加密**: 备份文件使用AES-256加密

## 5. 性能优化

### 5.1 索引策略
- **主键索引**: 所有表都有UUID主键
- **外键索引**: 所有外键字段都有索引
- **查询索引**: 根据常用查询模式创建复合索引
- **JSONB索引**: 使用GIN索引优化JSONB查询

### 5.2 分区策略
```sql
-- 按时间分区大表
CREATE TABLE responses_2025 PARTITION OF responses
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE point_transactions_2025 PARTITION OF point_transactions
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 5.3 查询优化
- **连接池**: 使用PgBouncer管理连接
- **读写分离**: 读操作使用只读副本
- **缓存策略**: 热点数据使用Redis缓存
- **查询监控**: 使用pg_stat_statements监控慢查询

---

**维护说明**: 本文档将随着数据库结构变更持续更新，所有数据库变更都需要通过migration脚本执行。
