import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// GET /api/maintenance-tasks
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const tasks = await prisma.maintenanceTask.findMany({
      where: status ? { status } : undefined,
      orderBy: { scheduledDate: 'desc' },
      include: {
        Technician: true,
      },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب مهام الصيانة' },
      { status: 500 },
    )
  }
}

// POST /api/maintenance-tasks  (إنشاء أو تحديث)
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()

    const {
      id,
      atmCode,
      technicianId,
      description,
      scheduledDate,
      status,
      priority,
    } = body

    if (!atmCode || !description || !scheduledDate) {
      return NextResponse.json(
        { error: 'كود الماكينة، الوصف، وتاريخ التنفيذ مطلوبة' },
        { status: 400 },
      )
    }

    const data = {
      atmCode,
      technicianId: technicianId ? Number(technicianId) : null,
      description,
      scheduledDate: new Date(scheduledDate),
      status: status || 'Pending',
      priority: priority || 'Medium',
    }

    if (id) {
      const updated = await prisma.maintenanceTask.update({
        where: { id: Number(id) },
        data,
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.maintenanceTask.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error saving maintenance task:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ مهمة الصيانة' },
      { status: 500 },
    )
  }
}

// PUT /api/maintenance-tasks  (تغيير الحالة فقط)
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'معرّف المهمة والحالة مطلوبان' },
        { status: 400 },
      )
    }

    const updated = await prisma.maintenanceTask.update({
      where: { id: Number(id) },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating maintenance task:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث مهمة الصيانة' },
      { status: 500 },
    )
  }
}

// DELETE /api/maintenance-tasks?id=123
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'معرّف المهمة مطلوب' },
        { status: 400 },
      )
    }

    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرّف المهمة غير صالح' },
        { status: 400 },
      )
    }

    await prisma.maintenanceTask.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف مهمة الصيانة بنجاح' })
  } catch (error) {
    console.error('Error deleting maintenance task:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف مهمة الصيانة' },
      { status: 500 },
    )
  }
}


