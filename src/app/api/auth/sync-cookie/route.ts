import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { user } = await request.json();

    if (!user) {
      return NextResponse.json(
        { error: 'User data is required' },
        { status: 400 }
      );
    }

    // إنشاء response مع cookie
    const response = NextResponse.json({ success: true });
    
    // تعيين cookie للمستخدم (لفترة 7 أيام)
    response.cookies.set('user', JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error syncing cookie:', error);
    return NextResponse.json(
      { error: 'Failed to sync cookie' },
      { status: 500 }
    );
  }
}

