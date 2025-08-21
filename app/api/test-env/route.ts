import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 
      `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : '未设置',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '已设置' : '未设置',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '未设置',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '已设置' : '未设置',
    FAL_KEY: process.env.FAL_KEY ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV,
  })
}
