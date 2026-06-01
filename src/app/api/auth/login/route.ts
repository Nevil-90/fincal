import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { comparePassword, generateAccessToken, generateRefreshToken, sendOtpEmail } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email').transform(s => s.toLowerCase().trim()),
  password: z.string().optional(),
  checkOnly: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const rateLimit = parseInt(process.env.RATE_LIMIT_LOGIN as string, 10)
    if (await isRateLimited(`login:${ip}`, rateLimit, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    
    const { email: cleanEmail, password, checkOnly } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (checkOnly || password === undefined) {
      if (user.passwordHash === null) {
        const otp = crypto.randomInt(100000, 1000000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

        await prisma.otpVerification.deleteMany({ where: { email: cleanEmail } })
        await prisma.otpVerification.create({
          data: { email: cleanEmail, otp, expiresAt }
        })

        const emailSent = await sendOtpEmail(cleanEmail, otp)

        if (!emailSent) {
          return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 })
        }

        return NextResponse.json({
          passwordSetupRequired: true,
          message: 'Verification code sent.'
        })
      }

      return NextResponse.json({
        passwordSetupRequired: false
      })
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Verification required' }, { status: 400 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 })
    }

    const passwordMatches = await comparePassword(password, user.passwordHash)
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Incorrect credentials' }, { status: 401 })
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role)
    const refreshToken = generateRefreshToken(user.id, user.email, user.role)

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    })

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
