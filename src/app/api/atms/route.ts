import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const atms = await prisma.aTM.findMany({
      orderBy: {
        atmCode: 'asc',
      },
    });
    
    // Transform data to match ATMData interface
    const transformedAtms = atms.map(atm => ({
      id: atm.id.toString(),
      bankName: atm.bankName,
      startDate: atm.startDate.toISOString().split('T')[0],
      governorate: atm.governorate,
      city: atm.city,
      atmModel: atm.atmModel,
      atmSerial: atm.atmSerial,
      atmCode: atm.atmCode,
      atmAddress: atm.address,
    }));
    
    return NextResponse.json(transformedAtms);
  } catch (error) {
    console.error('Error fetching ATMs:', error);
    return NextResponse.json({ error: 'Error fetching ATMs' }, { status: 500 });
  }
}

