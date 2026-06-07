// Admin endpoint that tests SMTP connectivity by verifying the transport
// and sending a test email to the configured SMTP address. Logs success/failure
// to the admin audit log.

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { config } from '@/lib/config'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1'

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSmtpConfigured = !!(config.smtpHost && config.smtpUser && config.smtpPass)

    if (!isSmtpConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Missing settings'
      }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    })

    await transporter.verify()

    const timestamp = new Date().toLocaleString()
    await transporter.sendMail({
      from: `"FinTracker" <${config.smtpUser}>`,
      to: config.smtpUser,
      subject: 'Diagnostics Successful',
      text: `SMTP diagnostics check succeeded at ${timestamp}.`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #0f172a; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2>Diagnostics Succeeded</h2>
          <p>SMTP diagnostics completed at: ${timestamp}</p>
        </div>
      `
    })

    await prisma.adminAuditLog.create({
      data: {
        adminId: currentUserId,
        action: 'SMTP_HEALTH_CHECK',
        details: JSON.stringify({ status: 'SUCCESS' }),
        ipAddress: clientIp
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Diagnostics completed.'
    })

  } catch (error: any) {
    try {
      const currentUserId = request.headers.get('x-user-id')
      const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1'
      if (currentUserId) {
        await prisma.adminAuditLog.create({
          data: {
            adminId: currentUserId,
            action: 'SMTP_HEALTH_CHECK_FAIL',
            details: JSON.stringify({ status: 'FAILED' }),
            ipAddress: clientIp
          }
        })
      }
    } catch (e) {}

    return NextResponse.json({
      success: false,
      error: 'Diagnostics failed'
    }, { status: 500 })
  }
}
