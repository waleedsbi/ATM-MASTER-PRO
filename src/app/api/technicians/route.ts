import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// GET /api/technicians
export async function GET() {
  try {
    const prisma = getPrisma()
    const technicians = await prisma.technician.findMany({
      orderBy: { id: 'desc' },
    })
    return NextResponse.json(technicians)
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الفنيين' },
      { status: 500 },
    )
  }
}

// POST /api/technicians
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()
    const { name, email, phone, avatarUrl } = body

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الفني مطلوب' },
        { status: 400 },
      )
    }

    const tech = await prisma.technician.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
      },
    })

    return NextResponse.json(tech, { status: 201 })
  } catch (error) {
    console.error('Error creating technician:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الفني' },
      { status: 500 },
    )
  }
}

// DELETE /api/technicians?id=123
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'معرّف الفني مطلوب' },
        { status: 400 },
      )
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرّف الفني غير صالح' },
        { status: 400 },
      )
    }

    const existing = await prisma.technician.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'الفني غير موجود' },
        { status: 404 },
      )
    }

    await prisma.technician.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف الفني بنجاح' })
  } catch (error) {
    console.error('Error deleting technician:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الفني' },
      { status: 500 },
    )
  }
}


