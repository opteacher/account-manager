# 密钥登录管理平台 - 设计系统

## 设计原则

简洁稳重、专业可信的政务风格，强调清晰的功能性和可靠的安全性。

### 核心价值观
- **简洁**：去除不必要的装饰，专注核心功能
- **稳重**：使用低饱和度色彩，传递专业感
- **清晰**：信息层次分明，易于理解
- **可靠**：设计语言一致，建立用户信任

---

## 色彩系统

### 主色调

```css
/* 主要蓝色 - 信任与专业 */
--primary-50: #E8F4FF
--primary-100: #D1EAFF
--primary-200: #B2DDFF
--primary-300: #89CBFF
--primary-400: #60B5FF
--primary-500: #3A9EFF
--primary-600: #1D84F0
--primary-700: #1A73E8
--primary-800: #2E5DAA
--primary-900: #3D4A75

/* 主色应用 */
--primary: #1A73E8
--primary-hover: #1558B5
--primary-active: #0E3D6D
```

### 中性色调

```css
/* 灰色系统 - 稳重与层次 */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827

/* 中性色应用 */
--background: #F9FAFB
--surface: #FFFFFF
--border: #E5E7EB
--text-primary: #111827
--text-secondary: #6B7280
--text-tertiary: #9CA3AF
```

### 功能色

```css
/* 成功 - 安全通过 */
--success-50: #ECFDF5
--success-500: #10B981
--success-600: #059669

/* 警告 - 注意事项 */
--warning-50: #FFFBEB
--warning-500: #F59E0B
--warning-600: #D97706

/* 错误 - 危险操作 */
--error-50: #FEF2F2
--error-500: #EF4444
--error-600: #DC2626

/* 信息 - 提示说明 */
--info-50: #EFF6FF
--info-500: #3B82F6
--info-600: #2563EB
```

---

## 排版系统

### 字体家族

```css
/* 主字体 - 系统字体 */
--font-family-sans:
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'PingFang SC',
  'Hiragino Sans GB',
  'Microsoft YaHei',
  'Helvetica Neue',
  Helvetica,
  Arial,
  sans-serif;

/* 等宽字体 - 代码展示 */
--font-family-mono:
  'SF Mono',
  'Monaco',
  'Inconsolata',
  'Roboto Mono',
  'Source Code Pro',
  monospace;
```

### 字体尺寸与行高

```css
/* 标题系统 */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* 行高系统 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
--leading-loose: 2;
```

### 字重

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 间距系统

```css
/* 8px 基准 */
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

---

## 圆角系统

```css
--radius-none: 0;
--radius-sm: 2px;
--radius-base: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

**政务风格推荐使用小圆角**：2px - 4px，传递严谨感。

---

## 阴影系统

```css
--shadow-sm:
  0 1px 2px 0 rgba(0, 0, 0, 0.05);

--shadow-base:
  0 1px 3px 0 rgba(0, 0, 0, 0.1),
  0 1px 2px 0 rgba(0, 0, 0, 0.06);

--shadow-md:
  0 4px 6px -1px rgba(0, 0, 0, 0.1),
  0 2px 4px -1px rgba(0, 0, 0, 0.06);

--shadow-lg:
  0 10px 15px -3px rgba(0, 0, 0, 0.1),
  0 4px 6px -2px rgba(0, 0, 0, 0.05);
```

---

## 组件设计规范

### 按钮

```css
/* 主要按钮 */
.btn-primary {
  background: var(--primary);
  color: white;
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-2) var(--spacing-6);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.btn-primary:active {
  background: var(--primary-active);
  border-color: var(--primary-active);
}

/* 次要按钮 */
.btn-secondary {
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-2) var(--spacing-6);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}
```

### 输入框

```css
.input-base {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-sm);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.input-base:hover {
  border-color: var(--gray-300);
}

.input-base:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-50);
}
```

### 卡片

```css
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-6);
}

.card-hover:hover {
  box-shadow: var(--shadow-base);
  border-color: var(--gray-200);
}
```

### 表格

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-base);
  overflow: hidden;
}

.table th {
  background: var(--gray-50);
  border-bottom: 2px solid var(--border);
  padding: var(--spacing-3) var(--spacing-4);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
}

.table td {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.table tr:hover td {
  background: var(--gray-50);
}
```

---

## 布局系统

### 容器

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.container-sm {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.container-lg {
  max-width: 1536px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}
```

### 网格

```css
.grid {
  display: grid;
  gap: var(--spacing-6);
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
```

---

## 设计反模式

### 避免使用

- ❌ 高饱和度色彩（如纯红、纯黄）
- ❌ 过大的圆角（大于 8px）
- ❌ 过度的动画和过渡效果
- ❌ 表情符号作为图标
- ❌ 炫酷的渐变背景
- ❌ 不一致的间距系统
- ❌ 过深的阴影效果

### 推荐做法

- ✅ 使用低饱和度、高对比度色彩
- ✅ 保持圆角在 2px - 4px 之间
- ✅ 微妙的过渡效果（200ms）
- ✅ 使用专业的 SVG 图标
- ✅ 简洁的纯色背景
- ✅ 统一的 8px 间距系统
- ✅ 轻柔的阴影效果

---

## Ant Design Vue 定制

### 主题覆盖

```javascript
// 在 src/main.ts 或 vite.config.ts 中配置
import { ConfigProvider } from 'ant-design-vue'

const theme = {
  token: {
    // 主色
    colorPrimary: '#1A73E8',
    colorPrimaryHover: '#1558B5',
    colorPrimaryActive: '#0E3D6D',

    // 圆角
    borderRadius: 4,
    borderRadiusLG: 6,

    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    fontSize: 14,

    // 边框
    colorBorder: '#E5E7EB',

    // 文字
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorTextTertiary: '#9CA3AF',

    // 背景
    colorBgBase: '#F9FAFB',
    colorBgContainer: '#FFFFFF',

    // 间距
    paddingXS: 4,
    paddingSM: 8,
    padding: 12,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,
  },
}
```

### 组件定制

```javascript
// 按钮样式定制
import { Button } from 'ant-design-vue'

Button.props = {
  ...Button.props,
  size: {
    type: String,
    default: 'middle',
  },
}

// 表格样式定制
import { Table } from 'ant-design-vue'

Table.props = {
  ...Table.props,
  size: {
    type: String,
    default: 'middle',
  },
  bordered: {
    type: Boolean,
    default: true,
  },
}
```

---

## 响应式断点

```css
/* 移动设备 */
@media (max-width: 640px) {
  /* 手机竖屏 */
}

@media (min-width: 641px) and (max-width: 768px) {
  /* 手机横屏 / 平板竖屏 */
}

/* 平板设备 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 平板 */
}

/* 桌面设备 */
@media (min-width: 1025px) and (max-width: 1280px) {
  /* 小屏桌面 */
}

@media (min-width: 1281px) {
  /* 大屏桌面 */
}
```

---

## 可访问性

### 颜色对比度

- 正文文字与背景对比度 ≥ 4.5:1
- 大号文字（18px+）对比度 ≥ 3:1
- 交互元素与背景对比度 ≥ 3:1

### 键盘导航

- 所有交互元素可通过 Tab 键访问
- 清晰的焦点状态（outline 或 box-shadow）
- 焦点指示器不使用 `outline: none`

### 屏幕阅读器

- 所有图片包含 `alt` 文本
- 表单输入关联 `<label>` 元素
- 图标按钮包含 `aria-label` 属性

---

## 实施指南

### 1. 创建全局样式文件

```css
/* src/styles/government-theme.css */
:root {
  /* 导入 CSS 变量 */
  @import './theme.css';
}

body {
  font-family: var(--font-family-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background: var(--background);
}
```

### 2. 配置 Ant Design Vue 主题

在 `src/main.ts` 中：

```javascript
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'

const app = createApp(App)

app.use(ConfigProvider, {
  theme: theme, // 见上面主题配置
  locale: zhCN,
})
```

### 3. 重构优先级

1. **高优先级**：登录页、主应用布局
2. **中优先级**：端点管理、模型列表
3. **低优先级**：辅助组件、表单元素

### 4. 逐步迁移策略

- 逐页重构，保持功能不变
- 先更新色彩和字体
- 然后调整间距和布局
- 最后完善交互效果

---

## 维护与更新

### 版本控制

- 每次设计系统更新记录在 CHANGELOG.md
- 重大变更需要团队评审

### 反馈收集

- 建立设计反馈机制
- 定期审查设计系统使用情况
- 根据用户反馈持续优化

---

**文档版本**: v1.0.0
**最后更新**: 2025-02-07
**维护者**: 密钥登录管理平台设计团队
