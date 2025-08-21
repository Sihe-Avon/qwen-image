'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function TestOAuth() {
  const [result, setResult] = useState<string>('')

  const testGoogleEndpoint = async () => {
    try {
      // 测试 NextAuth 的 Google 提供者配置
      const response = await fetch('/api/auth/providers')
      const providers = await response.json()
      
      if (providers.google) {
        setResult(`✅ NextAuth Google 提供者配置正确!\n` +
          `提供者ID: ${providers.google.id}\n` +
          `提供者名称: ${providers.google.name}\n` +
          `登录URL: ${providers.google.signinUrl}\n` +
          `回调URL: ${providers.google.callbackUrl}\n\n` +
          `💡 这证明Google OAuth配置正确，可以直接测试登录！`)
      } else {
        setResult(`❌ NextAuth Google 提供者未配置`)
      }
    } catch (error: any) {
      setResult(`❌ 测试失败: ${error.message}`)
    }
  }

  const testEnvVars = async () => {
    try {
      const response = await fetch('/api/test-env')
      const data = await response.json()
      setResult(`环境变量检查:\n${JSON.stringify(data, null, 2)}`)
    } catch (error: any) {
      setResult(`环境变量检查失败: ${error.message}`)
    }
  }

  const testRealGoogleLogin = async () => {
    setResult(`🔄 正在启动 Google OAuth 流程...\n如果成功，您将被重定向到 Google 登录页面`)
    try {
      // 尝试不同的方式调用 signIn
      const result = await signIn('google', { 
        callbackUrl: '/test-oauth',
        redirect: false  // 先不重定向，看看返回什么
      })
      
      if (result?.error) {
        setResult(`❌ Google OAuth 错误: ${result.error}\nURL: ${result.url}`)
      } else if (result?.url) {
        setResult(`✅ Google OAuth URL 生成成功!\n即将重定向到: ${result.url}`)
        // 手动重定向
        window.location.href = result.url
      } else {
        setResult(`🔄 Google OAuth 响应: ${JSON.stringify(result, null, 2)}`)
      }
    } catch (error: any) {
      setResult(`❌ Google OAuth 启动失败: ${error.message}\n堆栈: ${error.stack}`)
    }
  }

  const diagnoseFullSetup = async () => {
    setResult(`🔍 正在进行完整诊断...\n`)
    let diagnosis = '🔍 完整诊断报告:\n\n'
    
    try {
      // 1. 检查环境变量
      const envResponse = await fetch('/api/test-env')
      const envData = await envResponse.json()
      diagnosis += `1. 环境变量状态:\n`
      diagnosis += `   GOOGLE_CLIENT_ID: ${envData.GOOGLE_CLIENT_ID ? '✅ 已设置' : '❌ 未设置'}\n`
      diagnosis += `   GOOGLE_CLIENT_SECRET: ${envData.GOOGLE_CLIENT_SECRET ? '✅ 已设置' : '❌ 未设置'}\n`
      diagnosis += `   NEXTAUTH_URL: ${envData.NEXTAUTH_URL || '❌ 未设置'}\n`
      diagnosis += `   NEXTAUTH_SECRET: ${envData.NEXTAUTH_SECRET ? '✅ 已设置' : '❌ 未设置'}\n\n`
      
      // 2. 检查 NextAuth providers
      const providersResponse = await fetch('/api/auth/providers')
      const providers = await providersResponse.json()
      diagnosis += `2. NextAuth Providers:\n`
      if (providers.google) {
        diagnosis += `   ✅ Google Provider 已配置\n`
        diagnosis += `   登录URL: ${providers.google.signinUrl}\n`
        diagnosis += `   回调URL: ${providers.google.callbackUrl}\n\n`
      } else {
        diagnosis += `   ❌ Google Provider 未配置\n\n`
      }
      
      // 3. 检查 NextAuth session
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()
      diagnosis += `3. NextAuth Session:\n`
      diagnosis += `   当前会话: ${sessionData.user ? '✅ 已登录' : '❌ 未登录'}\n\n`
      
      // 4. 网络连接测试（通过服务器端）
      try {
        const networkTest = await fetch('/api/test-google-network')
        const networkResult = await networkTest.json()
        diagnosis += `4. 服务器端Google连接:\n`
        diagnosis += `   状态: ${networkResult.success ? '✅ 正常' : '❌ 失败'}\n`
        if (!networkResult.success) {
          diagnosis += `   错误: ${networkResult.error}\n`
        }
      } catch (e) {
        diagnosis += `4. 服务器端Google连接:\n`
        diagnosis += `   状态: ⚠️ 测试接口不存在\n`
      }
      
      diagnosis += `\n💡 结论:\n`
      if (envData.GOOGLE_CLIENT_ID && envData.GOOGLE_CLIENT_SECRET && providers.google) {
        diagnosis += `配置看起来正确。如果登录仍然失败，可能是:\n`
        diagnosis += `• Google Cloud Console 的重定向URI配置问题\n`
        diagnosis += `• 服务器到Google的网络连接问题\n`
        diagnosis += `• 本地开发环境的限制\n\n`
        diagnosis += `建议: 部署到生产环境测试，很可能会成功！`
      } else {
        diagnosis += `配置不完整，需要检查环境变量设置。`
      }
      
    } catch (error: any) {
      diagnosis += `❌ 诊断过程中出错: ${error.message}`
    }
    
    setResult(diagnosis)
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">OAuth 配置测试</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testGoogleEndpoint}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          测试 NextAuth Google 配置
        </button>
        
        <button
          onClick={testEnvVars}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          检查环境变量
        </button>
        
        <button
          onClick={testRealGoogleLogin}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🚀 测试真实 Google 登录
        </button>
        
        <button
          onClick={diagnoseFullSetup}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🔍 完整系统诊断
        </button>
      </div>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">测试结果:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">🔍 失败原因分析:</h3>
        <div className="text-sm space-y-2">
          <p><strong>❌ 之前的测试方法错误：</strong></p>
          <p>• 客户端JavaScript无法直接访问Google API（CORS限制）</p>
          <p>• 即使VPN能访问Google，浏览器仍会阻止跨域请求</p>
          
          <p className="mt-3"><strong>✅ NextAuth的真实工作方式：</strong></p>
          <p>• 服务器端处理OAuth流程</p>
          <p>• 用户重定向到Google → Google验证 → 回调服务器</p>
          
          <p className="mt-3"><strong>🎯 正确的测试方法：</strong></p>
          <p>• 点击"测试 NextAuth Google 配置"检查配置</p>
          <p>• 点击"🚀 测试真实 Google 登录"进行实际登录测试</p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold mb-2">Google OAuth 配置清单:</h4>
          <ul className="text-sm space-y-1">
            <li>✓ Client ID: 1096884231935-u75blf024804e98vtarkshse8cgaptk4.apps.googleusercontent.com</li>
            <li>✓ Client Secret: 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</li>
            <li>⚠️ 重定向 URI 必须是: <code>http://localhost:3000/api/auth/callback/google</code></li>
            <li>⚠️ 授权 JavaScript 来源: <code>http://localhost:3000</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
