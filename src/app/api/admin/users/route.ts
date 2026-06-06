import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        reason: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1'

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, action } = body

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUserId === currentUserId && (action === 'SUSPEND' || action === 'DEMOTE_USER')) {
      return NextResponse.json({ error: 'Action denied.' }, { status: 400 })
    }

    let updatedUser

    if (action === 'ACTIVATE') {
      updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: true }
      })

      await prisma.adminAuditLog.create({
        data: {
          adminId: currentUserId,
          action: 'USER_ACTIVATE',
          details: JSON.stringify({ email: targetUser.email }),
          targetUserId,
          ipAddress: clientIp
        }
      })
    } else if (action === 'SUSPEND') {
      updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: false }
      })

      await prisma.userSession.deleteMany({
        where: { userId: targetUserId }
      })

      await prisma.adminAuditLog.create({
        data: {
          adminId: currentUserId,
          action: 'USER_SUSPEND',
          details: JSON.stringify({ email: targetUser.email }),
          targetUserId,
          ipAddress: clientIp
        }
      })
    } else if (action === 'PROMOTE_ADMIN') {
      updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: 'ADMIN' }
      })

      await prisma.userSession.deleteMany({
        where: { userId: targetUserId }
      })

      await prisma.adminAuditLog.create({
        data: {
          adminId: currentUserId,
          action: 'ROLE_PROMOTE_ADMIN',
          details: JSON.stringify({ email: targetUser.email }),
          targetUserId,
          ipAddress: clientIp
        }
      })
    } else if (action === 'DEMOTE_USER') {
      updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: 'USER' }
      })

      await prisma.userSession.deleteMany({
        where: { userId: targetUserId }
      })

      await prisma.adminAuditLog.create({
        data: {
          adminId: currentUserId,
          action: 'ROLE_DEMOTE_USER',
          details: JSON.stringify({ email: targetUser.email }),
          targetUserId,
          ipAddress: clientIp
        }
      })
    } else if (action === 'DELETE') {
      await prisma.adminAuditLog.create({
        data: {
          adminId: currentUserId,
          action: 'USER_DELETE',
          details: JSON.stringify({ email: targetUser.email }),
          targetUserId,
          ipAddress: clientIp
        }
      })

      // The cascade delete in Prisma schema will automatically remove all related records
      // (transactions, goals, recurring transactions, etc.)
      updatedUser = await prisma.user.delete({
        where: { id: targetUserId }
      })
    } else {
      return NextResponse.json({ error: 'Invalid parameter' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Action completed.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        role: updatedUser.role
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
