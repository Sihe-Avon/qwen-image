import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 测试服务器端是否能连接到Google OAuth端点
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
    
    const response = await fetch('https://accounts.google.com/.well-known/openid_configuration', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NextAuth.js Test'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: 'Server can connect to Google OAuth endpoints',
        authorization_endpoint: data.authorization_endpoint,
        token_endpoint: data.token_endpoint
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: 'Server cannot connect to Google OAuth endpoints'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.name,
      message: 'Server-side Google connection failed'
    })
  }
}
