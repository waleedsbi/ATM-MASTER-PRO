import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// GET /api/banks - جلب جميع البنوك
export async function GET() {
  try {
    const prisma = getPrisma()
    const banks = await prisma.bank.findMany({
      orderBy: { id: 'desc' },
    })
    return NextResponse.json(banks)
  } catch (error) {
    console.error('Error fetching banks:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات البنوك' },
      { status: 500 },
    )
  }
}

// POST /api/banks - إضافة بنك جديد
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()

    const { nameAr, nameEn, governorate, city, address, mobile } = body

    if (!nameAr) {
      return NextResponse.json(
        { error: 'الاسم العربي حقل مطلوب' },
        { status: 400 },
      )
    }

    const bank = await prisma.bank.create({
      data: {
        nameAr,
        nameEn: nameEn || null,
        governorate: governorate || null,
        city: city || null,
        address: address || null,
        mobile: mobile || null,
      },
    })

    return NextResponse.json(bank, { status: 201 })
  } catch (error) {
    console.error('Error creating bank:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء البنك' },
      { status: 500 },
    )
  }
}

// DELETE /api/banks?id=123 - حذف بنك
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'معرّف البنك مطلوب' },
        { status: 400 },
      )
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرّف البنك غير صالح' },
        { status: 400 },
      )
    }

    const existing = await prisma.bank.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'البنك غير موجود' },
        { status: 404 },
      )
    }

    await prisma.bank.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف البنك بنجاح' })
  } catch (error) {
    console.error('Error deleting bank:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف البنك' },
      { status: 500 },
    )
  }
}


