import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// GET /api/employees - جلب جميع الموظفين
export async function GET() {
  try {
    const prisma = getPrisma()
    const employees = await prisma.employee.findMany({
      orderBy: { id: 'desc' },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الموظفين' },
      { status: 500 },
    )
  }
}

// DELETE /api/employees?id=123 - حذف موظف
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'معرّف الموظف مطلوب' },
        { status: 400 },
      )
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرّف الموظف غير صالح' },
        { status: 400 },
      )
    }

    const existing = await prisma.employee.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'الموظف غير موجود' },
        { status: 404 },
      )
    }

    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف الموظف بنجاح' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الموظف' },
      { status: 500 },
    )
  }
}


