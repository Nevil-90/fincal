import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.userSession.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1'

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    await prisma.userSession.delete({
      where: { id: sessionId }
    })

    await prisma.adminAuditLog.create({
      data: {
        adminId: currentUserId,
        action: 'SESSION_REVOKE',
        details: JSON.stringify({ email: session.user.email, sessionId }),
        targetUserId: session.userId,
        ipAddress: clientIp
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Terminated.'
    })

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
