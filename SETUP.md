# Qwen Image Generator - 设置指南

## 🎯 已实现功能

✅ **Google OAuth 登录**
✅ **渐进式免费额度** (3 + 2 credits)
✅ **智能限流** (Google 账号唯一性)
✅ **每日免费限额** ($20/天)
✅ **A/B 测试定价** (3个价位方案)
✅ **管理后台** (使用统计监控)
✅ **现代化 UI** (glassmorphism 设计)

## 🚀 启动步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```env
# FAL API Key (需要 Serverless API Key，格式：fal_sk_...)
FAL_KEY=your_fal_serverless_key_here

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-please-change-this

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. 设置 Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 "Google+ API"
4. 创建 OAuth 2.0 凭据：
   - 应用类型：Web 应用
   - 授权重定向 URI：`http://localhost:3000/api/auth/callback/google`
   - 复制 Client ID 和 Client Secret 到 `.env.local`

### 4. 获取 FAL API Key

1. 访问 [FAL.ai](https://fal.ai/)
2. 注册并登录账号
3. 进入 Dashboard
4. 生成 **Serverless API Key** (不是 Client ID/Secret)
5. 复制以 `fal_sk_...` 开头的密钥到 `.env.local`

### 5. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 💡 商业模式

### 用户获取 Credits 流程：
1. **Google 登录** → 获得 3 个初始 credits
2. **完善资料** → 额外获得 2 个 credits  
3. **余额不足** → 引导购买 Credit Pack

### 成本控制：
- **每日免费限额**: $20/天 (约 1000 credits)
- **Google 账号唯一性**: 防止重复注册
- **A/B 测试定价**: $7.99/$9.99/$12.99 三个价位

### A/B 测试：
- 用户随机分配到不同价位组
- 访问 `/admin` 查看转化数据
- 可手动指定测试组：`/pricing?test=test_a`

## 📊 监控面板

访问 `/admin` 查看：
- 今日免费额度使用情况
- 用户注册和活跃统计  
- 生成成功率
- 最近 7 天趋势

## 🔄 下一步

### 待实现功能：
- [ ] **Stripe 支付集成** (目前只是占位符)
- [ ] **邮件通知系统** (余额不足提醒)
- [ ] **用户生成历史** (需要图片存储)
- [ ] **内容审核** (NSFW 检测)
- [ ] **速率限制** (防止滥用)

### 生产环境准备：
- [ ] 迁移到 PostgreSQL + Prisma
- [ ] 添加 Redis 缓存
- [ ] 配置 CDN 图片存储
- [ ] 设置监控和日志
- [ ] 添加管理员认证

## 🎨 设计特色

- **连续背景**: 无断裂的渐变背景
- **Glassmorphism**: 半透明毛玻璃效果
- **响应式设计**: 移动端友好
- **字体层级**: Inter + Space Grotesk
- **A11y 友好**: 键盘导航支持

## 💰 预期收入模型

**保守估算** (月活 1000 用户):
- 新用户成本: $100
- 付费转化率: 15%
- 月收入: $1,498
- 净利润: $1,098

**扩展版本** (月活 10,000 用户):
- 新用户成本: $1,000  
- 付费转化率: 12%
- 月收入: $11,988
- 净利润: $8,588

立即开始测试你的 AI 图像生成平台吧！🚀
