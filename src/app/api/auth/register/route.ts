// User registration endpoint. Creates an inactive account and sends a
// verification OTP to the provided email address.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendOtpEmail } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').transform(s => s.trim()),
  lastName: z.string().min(1, 'Last name is required').transform(s => s.trim()),
  email: z.string().email('Invalid email').transform(s => s.toLowerCase().trim()),
  reason: z.string().min(1, 'Reason is required').transform(s => s.trim())
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const rateLimit = parseInt(process.env.RATE_LIMIT_REGISTER as string, 10)
    if (await isRateLimited(`register:${ip}`, rateLimit, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    
    const { firstName, lastName, email: cleanEmail, reason } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (existingUser) {
      if (existingUser.isActive) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
    } else {
      await prisma.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          reason: reason.trim(),
          passwordHash: null,
          isActive: false
        }
      })
    }

    const otp = crypto.randomInt(100000, 1000000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail }
    })

    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt
      }
    })

    const emailSent = await sendOtpEmail(cleanEmail, otp)

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent.' 
    })

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
