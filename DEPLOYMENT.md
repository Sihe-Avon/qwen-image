# Qwen Image Generator - 部署指南

## 🎯 部署到 Vercel

### 1. 准备 GitHub 仓库

```bash
# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit: Qwen Image Generator"

# 推送到 GitHub（替换为你的仓库地址）
git branch -M main
git remote add origin https://github.com/your-username/qwen-image.git
git push -u origin main
```

### 2. 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 `qwen-image` 仓库
5. 点击 "Deploy"

### 3. 配置生产环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# FAL API
FAL_KEY=e84b7c16-dc94-4f1d-937f-ed4c88aca1f9:ebdcf6db3341ba1f729617ce9bfefcdc

# NextAuth 配置
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=1tAcUUUAntq1SunfSAz3wubdUCZaLwIYphBj1wYuSJ0=

# Google OAuth
GOOGLE_CLIENT_ID=1096884231935-u75blf024804e98vtarkshse8cgaptk4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Stripe 支付（可选）
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. 更新 Google OAuth 配置

部署完成后，获取你的 Vercel 域名（如：`https://qwen-image-abc123.vercel.app`）

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入你的项目
3. 导航到 "APIs & Services" > "Credentials"
4. 编辑你的 OAuth 2.0 客户端ID
5. 添加新的重定向 URI：
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
6. 添加授权 JavaScript 来源：
   ```
   https://your-app-name.vercel.app
   ```

### 5. 测试生产环境

1. 访问你的 Vercel 应用
2. 点击 "Sign in with Google to Generate"
3. 应该能成功重定向到 Google 登录页面
4. 完成登录后应该返回到你的应用

## 🔧 常见问题

### Q: 部署后仍然无法登录？
A: 检查以下项目：
- Vercel 环境变量是否正确设置
- Google OAuth 重定向 URI 是否使用了正确的 Vercel 域名
- NEXTAUTH_URL 是否设置为 Vercel 域名

### Q: 如何查看部署日志？
A: 在 Vercel 控制台的 "Functions" 标签页可以查看服务器端日志

### Q: 如何更新代码？
A: 推送到 GitHub 主分支，Vercel 会自动重新部署

## 🎉 部署成功后

恭喜！你的 Qwen Image Generator 现在已经在生产环境运行了！

接下来可以：
1. 测试完整的用户流程
2. 配置 Stripe 支付（如需要）
3. 监控用户使用情况
4. 优化性能和用户体验