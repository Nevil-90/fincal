import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backupsDir = path.resolve(process.cwd(), 'prisma/backups')
    
    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json({ success: true, backups: [] })
    }

    const files = fs.readdirSync(backupsDir)
    const backups = files
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupsDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          sizeBytes: stats.size,
          createdAt: stats.birthtime
        }
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return NextResponse.json({ success: true, backups })
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

    const dbPath = path.resolve(process.cwd(), 'prisma/dev.db')
    const backupsDir = path.resolve(process.cwd(), 'prisma/backups')

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Source file not found' }, { status: 404 })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFilename = `backup_${timestamp}.db`
    const destPath = path.join(backupsDir, backupFilename)

    fs.copyFileSync(dbPath, destPath)
    
    const stats = fs.statSync(destPath)

    await prisma.adminAuditLog.create({
      data: {
        adminId: currentUserId,
        action: 'DB_BACKUP_CREATE',
        details: JSON.stringify({ filename: backupFilename, sizeBytes: stats.size }),
        ipAddress: clientIp
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Completed.',
      backup: {
        filename: backupFilename,
        sizeBytes: stats.size,
        createdAt: stats.birthtime
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
