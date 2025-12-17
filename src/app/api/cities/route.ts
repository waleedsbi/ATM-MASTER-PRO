import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url)
    const governorateName = searchParams.get('governorate')
    
    if (!governorateName) {
      // If no governorate specified, return all cities
      const allCities = await prisma.cityCode.findMany({
        where: {
          IsDeleted: false,
          IsNotActive: false,
        },
        select: {
          CityId: true,
          CityNameL1: true,
          CityNameL2: true,
          GovernorateCode: {
            select: {
              GovernorateNameL1: true,
              GovernorateNameL2: true,
            },
          },
        },
        orderBy: {
          CityNameL1: 'asc',
        },
      })
      
      const cityNames = allCities
        .map(city => city.CityNameL1 || city.CityNameL2)
        .filter((name): name is string => !!name && name.trim() !== '')
        .filter((name, index, self) => self.indexOf(name) === index)
        .sort()
      
      return NextResponse.json(cityNames)
    }
    
    // Find governorate first
    const governorate = await prisma.governorateCode.findFirst({
      where: {
        OR: [
          { GovernorateNameL1: { contains: governorateName } },
          { GovernorateNameL2: { contains: governorateName } },
        ],
      },
      select: {
        GovernorateId: true,
      },
    })
    
    if (!governorate) {
      // Governorate not found, return empty array
      return NextResponse.json([])
    }
    
    // Fetch cities for this governorate
    const cities = await prisma.cityCode.findMany({
      where: {
        GovernorateCodeId: governorate.GovernorateId,
        IsDeleted: false,
        IsNotActive: false,
      },
      select: {
        CityId: true,
        CityNameL1: true,
        CityNameL2: true,
      },
      orderBy: {
        CityNameL1: 'asc',
      },
    })
    
    // Transform to simple array of names
    const cityNames = cities
      .map(city => city.CityNameL1 || city.CityNameL2)
      .filter((name): name is string => !!name && name.trim() !== '')
      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
      .sort()
    
    // If no results, try without filters
    if (cityNames.length === 0) {
      const allCitiesForGov = await prisma.cityCode.findMany({
        where: {
          GovernorateCodeId: governorate.GovernorateId,
        },
        select: {
          CityId: true,
          CityNameL1: true,
          CityNameL2: true,
        },
        orderBy: {
          CityNameL1: 'asc',
        },
      })
      
      const allCityNames = allCitiesForGov
        .map(city => city.CityNameL1 || city.CityNameL2)
        .filter((name): name is string => !!name && name.trim() !== '')
        .filter((name, index, self) => self.indexOf(name) === index)
        .sort()
      
      return NextResponse.json(allCityNames)
    }
    
    return NextResponse.json(cityNames)
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json([])
  }
}

