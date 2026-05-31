import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'
import { config } from '@/lib/config'

const JWT_SECRET = config.jwtSecret

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    if (await isRateLimited(`set-password:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const body = await request.json()
    const { password, token } = body

    if (!password || !token) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string; purpose: string }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 })
    }

    if (decoded.purpose !== 'set-password') {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 })
    }

    const cleanEmail = decoded.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        passwordHash,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password configured successfully.'
    })

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
