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
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2>FinTracker</h2>
          <p>Verification code:</p>
          <div style="background-color: #f8fafc; padding: 15px; font-size: 28px; font-weight: 900; text-align: center; letter-spacing: 6px; border-radius: 8px; margin: 24px 0; border: 1px solid #cbd5e1; color: #0f172a;">
            ${otp}
          </div>
        </div>
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
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2>FinTracker</h2>
          <p>Password reset link:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
        </div>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}
