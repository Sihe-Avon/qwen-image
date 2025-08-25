import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/db-simple'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

export async function POST(req: NextRequest) {
  try {
    const { email, name, image } = await req.json()
    
    if (!email || !name) {
      return NextResponse.json({ success: false, error: 'Email and name are required' })
    }

    // 创建或获取用户
    const user = await getOrCreateUser(email, name, image)
    
    // 创建一个简单的会话 token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      creditsBalance: user.creditsBalance,
      profileCompleted: user.profileCompleted,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // 设置 cookie（模拟 NextAuth session）
    const cookieStore = await cookies()
    cookieStore.set('dev-session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 天
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        creditsBalance: user.creditsBalance,
        profileCompleted: user.profileCompleted,
      }
    })
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
