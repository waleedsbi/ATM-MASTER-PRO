import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export async function GET() {
  try {
    const prisma = getPrisma()
    
    // Fetch ALL governorates from GovernorateCode table (no filters to get all available)
    const governorates = await prisma.governorateCode.findMany({
      select: {
        GovernorateId: true,
        GovernorateNameL1: true,
        GovernorateNameL2: true,
      },
      orderBy: {
        GovernorateNameL1: 'asc',
      },
    })
    
    // Transform to simple array of names
    const governorateNames = governorates
      .map(gov => gov.GovernorateNameL1 || gov.GovernorateNameL2)
      .filter((name): name is string => !!name && name.trim() !== '')
      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
      .sort()
    
    // If no results from database, return common governorates as fallback
    if (governorateNames.length === 0) {
      console.warn('No governorates found in database, returning fallback list');
      return NextResponse.json([
        'القاهرة',
        'الجيزة',
        'الإسكندرية',
        'المنيا',
        'أسيوط',
        'سوهاج',
        'قنا',
        'الأقصر',
        'أسوان',
        'الدقهلية',
        'الشرقية',
        'البحيرة',
        'كفر الشيخ',
        'الغربية',
        'المنوفية',
        'الفيوم',
        'بني سويف',
      ]);
    }
    
    return NextResponse.json(governorateNames)
  } catch (error) {
    console.error('Error fetching governorates:', error)
    
    // Fallback: return common governorates
    return NextResponse.json([
      'القاهرة',
      'الجيزة',
      'الإسكندرية',
      'المنيا',
      'أسيوط',
      'سوهاج',
      'قنا',
      'الأقصر',
      'أسوان',
      'الدقهلية',
      'الشرقية',
      'البحيرة',
      'كفر الشيخ',
      'الغربية',
      'المنوفية',
      'الفيوم',
      'بني سويف',
    ])
  }
}

