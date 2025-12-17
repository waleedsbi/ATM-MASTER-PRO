import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// GET /api/bank-plan-report - جلب تقارير البنوك
export async function GET() {
  try {
    const prisma = getPrisma()
    const reports = await prisma.bankPlanReport.findMany({
      orderBy: { id: 'desc' },
    })

    // تحويل الحقول النصية (JSON) إلى هياكل TypeScript متوافقة مع WorkPlanReport
    const mapped = reports.map((r) => ({
      id: String(r.id),
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      orderNumber: r.orderNumber,
      executionDate: r.executionDate.toISOString(),
      atmCode: r.atmCode,
      atmSerial: r.atmSerial ?? '',
      atmAddress: r.atmAddress ?? '',
      representative: r.representative ?? '',
      status: (r.status as any) ?? 'Pending',
      beforeImages: r.beforeImages ? (JSON.parse(r.beforeImages) as string[]) : [],
      afterImages: r.afterImages ? (JSON.parse(r.afterImages) as string[]) : [],
      notes: r.notes ? JSON.parse(r.notes) : [],
      bankName: r.bankName ?? undefined,
      governorate: r.governorate ?? undefined,
      city: r.city ?? undefined,
      statement: r.statement ?? undefined,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error fetching bank plan reports:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تقارير البنوك' },
      { status: 500 },
    )
  }
}

// POST /api/bank-plan-report - إنشاء تقرير جديد (اختياري للاستخدام المستقبلي)
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()

    const {
      startDate,
      endDate,
      orderNumber,
      executionDate,
      atmCode,
      atmSerial,
      atmAddress,
      representative,
      status,
      beforeImages,
      afterImages,
      notes,
      bankName,
      governorate,
      city,
      statement,
    } = body

    if (!startDate || !endDate || !orderNumber || !executionDate || !atmCode) {
      return NextResponse.json(
        { error: 'بعض الحقول الأساسية مفقودة' },
        { status: 400 },
      )
    }

    const created = await prisma.bankPlanReport.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        orderNumber: Number(orderNumber),
        executionDate: new Date(executionDate),
        atmCode,
        atmSerial: atmSerial || null,
        atmAddress: atmAddress || null,
        representative: representative || null,
        status: status || 'Pending',
        beforeImages: beforeImages ? JSON.stringify(beforeImages) : null,
        afterImages: afterImages ? JSON.stringify(afterImages) : null,
        notes: notes ? JSON.stringify(notes) : null,
        bankName: bankName || null,
        governorate: governorate || null,
        city: city || null,
        statement: statement || null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating bank plan report:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء تقرير البنك' },
      { status: 500 },
    )
  }
}

// PUT /api/bank-plan-report - تحديث حالة التقرير أو الصور/الملاحظات
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()
    const { id, status, beforeImages, afterImages, notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'معرّف التقرير مطلوب' },
        { status: 400 },
      )
    }

    const reportId = parseInt(String(id), 10)
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'معرّف التقرير غير صالح' },
        { status: 400 },
      )
    }

    const existing = await prisma.bankPlanReport.findUnique({
      where: { id: reportId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'التقرير غير موجود' },
        { status: 404 },
      )
    }

    const updated = await prisma.bankPlanReport.update({
      where: { id: reportId },
      data: {
        status: status ?? existing.status,
        beforeImages:
          beforeImages !== undefined
            ? JSON.stringify(beforeImages)
            : existing.beforeImages,
        afterImages:
          afterImages !== undefined
            ? JSON.stringify(afterImages)
            : existing.afterImages,
        notes:
          notes !== undefined ? JSON.stringify(notes) : existing.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating bank plan report:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث تقرير البنك' },
      { status: 500 },
    )
  }
}


