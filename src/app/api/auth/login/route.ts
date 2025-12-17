import { getPrisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { compare } from 'bcrypt'

export async function POST(request: Request) {
  try {
    // التحقق من اتصال Prisma
    const prisma = getPrisma()
    
    // قراءة البيانات من الطلب
    let email: string
    let password: string
    
    try {
      const body = await request.json()
      email = body.email
      password = body.password
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'بيانات الطلب غير صحيحة' },
        { status: 400 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // البحث عن المستخدم
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      })
    } catch (dbError) {
      console.error('Database error while finding user:', dbError)
      return NextResponse.json(
        { error: 'حدث خطأ في الاتصال بقاعدة البيانات' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'الحساب غير مفعّل. يرجى الاتصال بالمسؤول' },
        { status: 403 }
      )
    }

    // التحقق من كلمة المرور
    let passwordMatch = false
    try {
      passwordMatch = await compare(password, user.password)
    } catch (compareError) {
      console.error('Error comparing passwords:', compareError)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء التحقق من كلمة المرور' },
        { status: 500 }
      )
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // إرجاع بيانات المستخدم بدون كلمة المرور
    const { password: _, ...userWithoutPassword } = user

    // التحقق من صحة البيانات قبل الإرجاع
    if (!userWithoutPassword.id || !userWithoutPassword.email || !userWithoutPassword.name || !userWithoutPassword.role) {
      console.error('Invalid user data:', userWithoutPassword)
      return NextResponse.json(
        { error: 'بيانات المستخدم غير مكتملة' },
        { status: 500 }
      )
    }

    // إنشاء response مع cookie للمصادقة
    const response = NextResponse.json({
      user: userWithoutPassword
    })

    // تعيين cookie للمستخدم (لفترة 7 أيام)
    try {
      response.cookies.set('user', JSON.stringify(userWithoutPassword), {
        httpOnly: false, // يجب أن يكون false ليتمكن JavaScript من الوصول إليه أيضاً
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 أيام
        path: '/',
      })
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError)
      // لا نعيد الخطأ هنا لأن تسجيل الدخول نجح، فقط cookie فشل
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

