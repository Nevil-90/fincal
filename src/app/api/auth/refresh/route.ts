// Issues a new access token by validating the refresh token cookie against
// the stored session. Cleans up the session if it has expired.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const session = await prisma.userSession.findUnique({
      where: { token: refreshToken }
    })

    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await prisma.userSession.delete({ where: { id: session.id } })
      }
      return NextResponse.json({ error: 'Expired session' }, { status: 401 })
    }

    const newAccessToken = generateAccessToken(payload.userId, payload.email, payload.role)

    const response = NextResponse.json({ success: true })

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })

    return response

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
