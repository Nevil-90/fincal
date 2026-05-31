import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import crypto from 'crypto'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email').transform(s => s.toLowerCase().trim())
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const rateLimit = parseInt(process.env.RATE_LIMIT_FORGOT_PASSWORD as string, 10)
    if (await isRateLimited(`forgot-password:${ip}`, rateLimit, 120000)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    
    const { email: cleanEmail } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If the email address is registered, you will receive a reset link shortly.'
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordReset.deleteMany({
      where: { email: cleanEmail }
    })

    await prisma.passwordReset.create({
      data: {
        email: cleanEmail,
        token,
        expiresAt
      }
    })

    const hostOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const resetUrl = `${hostOrigin}/reset-password?token=${token}`

    const emailSent = await sendPasswordResetEmail(cleanEmail, resetUrl)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'If the email address is registered, you will receive a reset link shortly.'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred.' },
      { status: 500 }
    )
  }
}
