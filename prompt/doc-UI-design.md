# 智问数研 - UI设计规范

## 文档信息
- **版本**: v1.0
- **编写日期**: 2025年8月
- **负责人**: 产品设计团队

## 1. 设计原则

### 1.1 核心原则
- **简洁性**: 界面简洁明了，避免不必要的装饰元素
- **一致性**: 保持整个产品的视觉和交互一致性
- **可用性**: 优先考虑用户体验和操作便利性
- **可访问性**: 确保所有用户都能正常使用产品

### 1.2 设计理念
- **以用户为中心**: 所有设计决策都以用户需求为出发点
- **数据驱动**: 基于用户行为数据优化设计
- **持续迭代**: 根据用户反馈持续改进设计

## 2. 色彩系统

### 2.1 主色调
```css
/* 主品牌色 */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6; /* 主色 */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
```

### 2.2 功能色彩
```css
/* 成功色 */
--success-500: #10b981;
--success-600: #059669;

/* 警告色 */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* 错误色 */
--error-500: #ef4444;
--error-600: #dc2626;

/* 信息色 */
--info-500: #06b6d4;
--info-600: #0891b2;
```

### 2.3 中性色
```css
/* 灰色系 */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

## 3. 字体系统

### 3.1 字体族
```css
/* 中文字体 */
font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

/* 英文字体 */
font-family: "Inter", "Helvetica Neue", Arial, sans-serif;

/* 等宽字体 */
font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
```

### 3.2 字体大小
```css
/* 标题字体 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### 3.3 字重
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 4. 间距系统

### 4.1 基础间距
```css
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
--spacing-20: 5rem;    /* 80px */
```

### 4.2 布局间距
- **页面边距**: 24px (桌面端) / 16px (移动端)
- **卡片间距**: 16px
- **组件内间距**: 12px
- **元素间距**: 8px

## 5. 组件规范

### 5.1 按钮组件
#### 5.1.1 主要按钮
```css
.btn-primary {
  background-color: var(--primary-600);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: var(--primary-700);
  transform: translateY(-1px);
}
```

#### 5.1.2 次要按钮
```css
.btn-secondary {
  background-color: transparent;
  color: var(--primary-600);
  border: 1px solid var(--primary-600);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: var(--primary-50);
}
```

### 5.2 输入框组件
```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:error {
  border-color: var(--error-500);
}
```

### 5.3 卡片组件
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## 6. 图标系统

### 6.1 图标库
- **主要图标库**: Lucide React
- **备用图标库**: Heroicons
- **自定义图标**: SVG格式，24x24px基准尺寸

### 6.2 图标使用规范
- **尺寸**: 16px (小), 20px (中), 24px (大), 32px (特大)
- **颜色**: 继承文本颜色或使用主题色
- **对齐**: 与文本基线对齐

## 7. 响应式设计

### 7.1 断点设置
```css
/* 移动端 */
@media (max-width: 640px) { /* sm */ }

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) { /* md */ }

/* 桌面端 */
@media (min-width: 1025px) { /* lg */ }

/* 大屏幕 */
@media (min-width: 1280px) { /* xl */ }
```

### 7.2 布局适配
- **移动端**: 单列布局，全宽组件
- **平板端**: 两列布局，适中间距
- **桌面端**: 多列布局，充分利用空间

## 8. 动画与过渡

### 8.1 过渡时间
```css
--transition-fast: 0.15s;
--transition-normal: 0.2s;
--transition-slow: 0.3s;
```

### 8.2 缓动函数
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 8.3 常用动画
- **淡入淡出**: opacity变化
- **滑动**: transform: translateY()
- **缩放**: transform: scale()
- **旋转**: transform: rotate()

## 9. 状态设计

### 9.1 加载状态
- **骨架屏**: 内容加载时显示
- **加载指示器**: 操作进行时显示
- **进度条**: 长时间操作显示进度

### 9.2 空状态
- **无数据**: 友好的空状态提示
- **错误状态**: 清晰的错误信息和解决方案
- **成功状态**: 积极的成功反馈

### 9.3 交互状态
- **悬停**: 鼠标悬停时的视觉反馈
- **激活**: 点击或选中时的状态
- **禁用**: 不可操作时的灰化状态

## 10. 可访问性规范

### 10.1 颜色对比度
- **正常文本**: 对比度至少4.5:1
- **大文本**: 对比度至少3:1
- **非文本元素**: 对比度至少3:1

### 10.2 键盘导航
- **Tab顺序**: 逻辑清晰的Tab导航顺序
- **焦点指示**: 清晰的焦点视觉指示
- **快捷键**: 常用操作的键盘快捷键

### 10.3 屏幕阅读器
- **语义化HTML**: 使用正确的HTML标签
- **ARIA标签**: 适当使用ARIA属性
- **替代文本**: 图片和图标的替代文本

## 11. 设计工具与资源

### 11.1 设计工具
- **主要工具**: Figma
- **原型工具**: Figma Prototype
- **图标工具**: Figma + Lucide
- **色彩工具**: Coolors.co

### 11.2 设计资源
- **设计系统**: Figma组件库
- **图标库**: Lucide Icons
- **字体**: Google Fonts
- **图片**: Unsplash, Pexels

### 11.3 协作流程
1. **设计稿**: Figma设计稿
2. **评审**: 设计评审会议
3. **标注**: Figma Dev Mode
4. **交付**: 设计规范文档

---

**维护说明**: 本规范将随着产品发展持续更新，所有设计师和开发者都应遵循此规范。
