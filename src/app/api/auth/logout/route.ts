// Logs the user out by deleting their session from the database
// and clearing the access_token and refresh_token cookies.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (refreshToken) {
      await prisma.userSession.deleteMany({
        where: { token: refreshToken }
      })
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

    response.cookies.set('access_token', '', { path: '/', maxAge: 0 })
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })

    return response
  } catch (error) {
    console.error('Error during logout API:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
