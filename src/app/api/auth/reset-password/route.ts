// Validates a password reset token and sets the user's new password.
// Invalidates all existing sessions after the reset.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required').transform(s => s.trim()),
  password: z.string().min(8, 'Password must be at least 8 characters long')
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const rateLimit = parseInt(process.env.RATE_LIMIT_RESET_PASSWORD as string, 10)
    if (await isRateLimited(`reset-password:${ip}`, rateLimit, 120000)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    
    const { token, password } = parsed.data

    const resetEntry = await prisma.passwordReset.findUnique({
      where: { token: token.trim() }
    })

    if (!resetEntry) {
      return NextResponse.json(
        { error: 'Invalid or expired token.' },
        { status: 400 }
      )
    }

    if (new Date() > resetEntry.expiresAt) {
      await prisma.passwordReset.delete({ where: { id: resetEntry.id } })
      return NextResponse.json(
        { error: 'Link has expired.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: resetEntry.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true
      }
    })

    await prisma.passwordReset.delete({
      where: { token: resetEntry.token }
    })

    await prisma.userSession.deleteMany({
      where: { userId: user.id }
    })

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully.'
    })
    response.cookies.set('access_token', '', { path: '/', maxAge: 0 })
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })

    return response

  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred.' },
      { status: 500 }
    )
  }
}
