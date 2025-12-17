import { getPrisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const prisma = getPrisma()
    const body = await request.json()
    
    // Use DelegateData model instead of representative
    const delegate = await prisma.delegateData.create({
      data: {
        DelegateNameL1: body.name || body.DelegateNameL1,
        DelegateNameL2: body.name || body.DelegateNameL2,
        DelegateEmail: body.email || body.DelegateEmail,
        DelegateMobil: body.phone || body.DelegateMobil,
        Isdeleted: false,
        IsNotactive: false,
      },
    })
    
    // Transform to match expected format
    return NextResponse.json({
      id: delegate.DelegateId,
      name: delegate.DelegateNameL1 || delegate.DelegateNameL2 || '',
      username: delegate.DelegateEmail || '',
      email: delegate.DelegateEmail || '',
      phone: delegate.DelegateMobil || '',
    })
  } catch (error) {
    console.error('Error creating representative:', error)
    return NextResponse.json({ 
      error: 'Error creating representative',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const prisma = getPrisma()
    const representatives: any[] = []
    
    // جلب البيانات من Representative model إذا كان متاحاً
    if (prisma.representative) {
      try {
        const reps = await prisma.representative.findMany({
          orderBy: {
            name: 'asc',
          },
        })
        
        representatives.push(...reps.map(rep => ({
          id: rep.id,
          name: rep.name || '',
          username: rep.username || rep.email?.split('@')[0] || '',
          email: rep.email || '',
          phone: rep.phone || '',
        })))
      } catch (error) {
        console.warn('Error fetching from Representative model:', error)
      }
    }
    
    // جلب البيانات من DelegateData model كبديل أو إضافة
    if (prisma.delegateData) {
      try {
        const delegates = await prisma.delegateData.findMany({
          where: {
            Isdeleted: false,
            IsNotactive: false,
          },
          orderBy: {
            DelegateNameL1: 'asc',
          },
        })
        
        // إضافة المندوبين من DelegateData إذا لم يكونوا موجودين في Representative
        const existingEmails = new Set(representatives.map(r => r.email?.toLowerCase()))
        
        delegates.forEach(delegate => {
          const email = delegate.DelegateEmail?.toLowerCase()
          if (!email || !existingEmails.has(email)) {
            representatives.push({
              id: delegate.DelegateId,
              name: delegate.DelegateNameL1 || delegate.DelegateNameL2 || '',
              username: delegate.DelegateEmail?.split('@')[0] || '',
              email: delegate.DelegateEmail || '',
              phone: delegate.DelegateMobil || '',
              address: delegate.DelegateAddress || '',
            })
          }
        })
      } catch (error) {
        console.warn('Error fetching from DelegateData model:', error)
      }
    }
    
    // ترتيب حسب الاسم
    representatives.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    
    return NextResponse.json(representatives)
  } catch (error) {
    console.error('Error fetching representatives:', error)
    return NextResponse.json({ 
      error: 'Error fetching representatives',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}