import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { hash, compare } from 'bcrypt'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}