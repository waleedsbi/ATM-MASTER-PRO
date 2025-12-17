import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' })
  
  // حذف cookie المستخدم
  response.cookies.set('user', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // حذف cookie
    path: '/',
  })

  return response
}

