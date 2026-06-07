// Verifies an OTP code for a given email. On success, activates the user account
// and returns a short-lived JWT for the set-password step.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'
import { config } from '@/lib/config'

const JWT_SECRET = config.jwtSecret

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    if (await isRateLimited(`verify-otp:${ip}`, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    const verification = await prisma.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        otp: otp.trim()
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!verification) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (new Date() > verification.expiresAt) {
      await prisma.otpVerification.delete({ where: { id: verification.id } })
      return NextResponse.json({ error: 'Code has expired.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      await prisma.user.update({
        where: { email: cleanEmail },
        data: { isActive: true }
      })
    }

    await prisma.otpVerification.delete({
      where: { id: verification.id }
    })

    const setupToken = jwt.sign(
      { email: cleanEmail, purpose: 'set-password' },
      JWT_SECRET,
      { expiresIn: '10m' }
    )

    return NextResponse.json({
      success: true,
      message: 'Verified successfully',
      token: setupToken
    })

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
