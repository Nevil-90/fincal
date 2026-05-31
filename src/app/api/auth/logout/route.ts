import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (refreshToken) {
      // Delete session from database
      await prisma.userSession.deleteMany({
        where: { token: refreshToken }
      })
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

    // Clear access and refresh token cookies
    response.cookies.set('access_token', '', { path: '/', maxAge: 0 })
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })

    return response
  } catch (error) {
    console.error('Error during logout API:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
