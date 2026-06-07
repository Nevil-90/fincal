// Cron job endpoint for routine database housekeeping.
// Called by Vercel Cron (or any scheduler) with a Bearer token.
// Deletes: unverified users older than 24h, expired OTPs,
// expired password reset tokens, and expired sessions.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isActive: false,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    const deletedOtps = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    const deletedResets = await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

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
