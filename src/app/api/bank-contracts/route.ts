import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// GET /api/bank-contracts
export async function GET() {
  try {
    const prisma = getPrisma()
    const contracts = await prisma.bankContract.findMany({
      orderBy: { startDate: 'desc' },
      include: { Bank: true },
    })
    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Error fetching bank contracts:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب عقود البنوك' },
      { status: 500 },
    )
  }
}

// POST /api/bank-contracts
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()

    const {
      id,
      bankId,
      bankName,
      startDate,
      endDate,
      machineNumber,
      contractValue,
      statement,
      fileUrl,
    } = body

    if (!bankName || !startDate || !endDate || !machineNumber || contractValue == null) {
      return NextResponse.json(
        { error: 'بعض الحقول الأساسية مفقودة' },
        { status: 400 },
      )
    }

    const data = {
      bankId: bankId ? Number(bankId) : null,
      bankName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      machineNumber,
      contractValue: Number(contractValue),
      statement: statement || null,
      fileUrl: fileUrl || null,
    }

    if (id) {
      const updated = await prisma.bankContract.update({
        where: { id: Number(id) },
        data,
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.bankContract.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error saving bank contract:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ عقد البنك' },
      { status: 500 },
    )
  }
}

// DELETE /api/bank-contracts?id=123
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json(
        { error: 'معرّف العقد مطلوب' },
        { status: 400 },
      )
    }

    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'معرّف العقد غير صالح' },
        { status: 400 },
      )
    }

    await prisma.bankContract.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف العقد بنجاح' })
  } catch (error) {
    console.error('Error deleting bank contract:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف عقد البنك' },
      { status: 500 },
    )
  }
}


