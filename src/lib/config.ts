// Validates that required server-side environment variables are present at startup
// and exports them as a typed config object. Only runs on the server (not in the browser).

if (typeof window === 'undefined') {
  const missingSecrets: string[] = []

  if (!process.env.JWT_SECRET) missingSecrets.push('JWT_SECRET')
  if (!process.env.JWT_REFRESH_SECRET) missingSecrets.push('JWT_REFRESH_SECRET')
  if (!process.env.SMTP_USER) missingSecrets.push('SMTP_USER')
  if (!process.env.SMTP_PASS) missingSecrets.push('SMTP_PASS')

  if (missingSecrets.length > 0) {
    throw new Error(`Missing configuration: ${missingSecrets.join(', ')}`)
  }
}

export const config = {
  jwtSecret: process.env.JWT_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
}
