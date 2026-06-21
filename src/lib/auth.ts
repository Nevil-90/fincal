// Authentication utilities: password hashing, JWT generation/verification,
// and sending OTP + password reset emails via nodemailer.

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { config } from '@/lib/config'

const JWT_SECRET = config.jwtSecret
const JWT_REFRESH_SECRET = config.jwtRefreshSecret

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function generateAccessToken(userId: string, email: string, role: string): string {
  // @ts-expect-error: jwt.sign expects strict StringValue literal, but we use dynamic env var
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

export function generateRefreshToken(userId: string, email: string, role: string): string {
  // @ts-expect-error: jwt.sign expects strict StringValue literal, but we use dynamic env var
  return jwt.sign({ userId, email, role }, JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (e) {
    return null
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
  } catch (e) {
    return null
  }
}

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const isSmtpConfigured = !!(config.smtpHost && config.smtpUser && config.smtpPass)

  if (!isSmtpConfigured) {
    console.error('SMTP not configured — cannot send OTP email to', email)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    })

    await transporter.sendMail({
      from: `"FinTracker" <${config.smtpUser}>`,
      to: email,
      subject: 'Verification Code',
      text: `Verification code: ${otp}`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100% !important;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #111827; border: 1px solid #1f2937; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em;">FinTracker</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">Secure Personal Finance</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">Verification Required</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center;">Please use the following verification code to secure your FinTracker account. This code will expire in 15 minutes.</p>
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; color: #3b82f6; letter-spacing: 12px; padding-left: 12px; display: inline-block;">${otp}</span>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">If you did not request this verification code, please ignore this email or contact support if you have security concerns.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center; border-top: 1px solid #1f2937;">
              <p style="margin: 24px 0 0 0; font-size: 11px; color: #4b5563;">&copy; 2026 FinTracker Inc. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    return false
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const isSmtpConfigured = !!(config.smtpHost && config.smtpUser && config.smtpPass)

  if (!isSmtpConfigured) {
    console.error('SMTP not configured — cannot send password reset email to', email)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    })

    await transporter.sendMail({
      from: `"FinTracker" <${config.smtpUser}>`,
      to: email,
      subject: 'Password Reset',
      text: `Reset link: ${resetUrl}`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100% !important;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #111827; border: 1px solid #1f2937; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em;">FinTracker</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">Secure Personal Finance</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">Reset Your Password</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center;">We received a request to reset your password. Click the button below to configure a new secure password for your account.</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.35); border: 1px solid #3b82f6;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">If you did not request a password reset, please ignore this email. This link will expire shortly.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center; border-top: 1px solid #1f2937;">
              <p style="margin: 24px 0 0 0; font-size: 11px; color: #4b5563;">&copy; 2026 FinTracker Inc. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}
