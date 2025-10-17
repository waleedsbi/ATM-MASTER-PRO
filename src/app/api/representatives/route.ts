import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const representative = await prisma.representative.create({
      data: {
        name: body.name,
        username: body.username,
        email: body.email,
      },
    })
    return NextResponse.json(representative)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating representative' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const representatives = await prisma.representative.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(representatives)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching representatives' }, { status: 500 })
  }
}