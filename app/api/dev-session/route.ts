import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('dev-session-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        image: payload.image,
        creditsBalance: payload.creditsBalance,
        profileCompleted: payload.profileCompleted,
      }
    })
  } catch (error) {
    console.error('Dev session error:', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('dev-session-token')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to logout' })
  }
}
