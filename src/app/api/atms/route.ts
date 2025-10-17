import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const atms = await prisma.aTM.findMany({
      orderBy: {
        atmCode: 'asc',
      },
    });
    return NextResponse.json(atms);
  } catch (error) {
    console.error('Error fetching ATMs:', error);
    return NextResponse.json({ error: 'Error fetching ATMs' }, { status: 500 });
  }
}

