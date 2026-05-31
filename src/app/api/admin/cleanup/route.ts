import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Basic authorization for Vercel Cron
    const authHeader = request.headers.get('authorization');
    
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Delete Unverified Users older than 24h
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isActive: false,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    // 2. Delete Expired OTPs
    const deletedOtps = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // 3. Delete Expired Password Resets
    const deletedResets = await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // 4. Delete Expired Sessions
    const deletedSessions = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cleanup successful',
      deleted: {
        unverifiedUsers: deletedUsers.count,
        expiredOtps: deletedOtps.count,
        expiredResets: deletedResets.count,
        expiredSessions: deletedSessions.count,
      },
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Cleanup Job Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
