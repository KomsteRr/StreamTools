'use server'

import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSessionValue } from '@/lib/session'
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/rate-limit'

const ONE_HOUR = 60 * 60 * 1000
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

export async function login(prevState: { error: string } | null, formData: FormData) {
  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string
  const rememberMe = formData.get('rememberMe') === 'on'

  if (!username || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  // ── Rate limiting check ──────────────────────────────────────────────────
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  const rateCheck = checkLoginRateLimit(ip)
  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.blockedFor! / 60)
    return { error: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.` }
  }

  const expires = new Date(Date.now() + (rememberMe ? THIRTY_DAYS : ONE_HOUR))

  // ── Admin login (bcrypt comparison with ADMIN_PASSWORD) ────────────────────
  if (username.toLowerCase() === 'admin') {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set')
      return { error: 'Erreur de configuration serveur.' }
    }

    let adminUser = null
    try {
      adminUser = await prisma.user.findUnique({ where: { username: 'admin' } })
    } catch (error: any) {
      console.error('Erreur lors de la vérification de l\'admin:', error)
      return { error: 'Erreur de connexion à la base de données.' }
    }

    // Create admin user if not exists (use bcrypt hash for password)
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          role: 'admin',
          passwordHash: await bcrypt.hash(adminPassword, 12),
        },
      })
    }

    // Verify admin password with bcrypt
    if (!adminUser.passwordHash || !(await bcrypt.compare(password, adminUser.passwordHash))) {
      return { error: 'Mot de passe incorrect.' }
    }

    const sessionValue = await createSessionValue(adminUser.id, 'admin')
    const cookieStore = await cookies()
    cookieStore.set('session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      sameSite: 'strict',
      path: '/',
    })

    // Reset rate limiter on successful login
    resetLoginRateLimit(ip)

    redirect('/dashboard')
  }

  // ── Regular user login ─────────────────────────────────────────────────────
  let user = null
  try {
    user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } })
  } catch (error: any) {
    console.error('Erreur de base de données (Regular Login):', error)
    return { error: 'Erreur de connexion à la base de données.' }
  }

  if (!user || !user.passwordHash) {
    return { error: 'Utilisateur introuvable ou compte non activé.' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: 'Mot de passe incorrect.' }
  }

  const sessionValue = await createSessionValue(user.id, user.role as 'admin' | 'user')
  const cookieStore = await cookies()
  cookieStore.set('session', sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  })

  // Reset rate limiter on successful login
  resetLoginRateLimit(ip)

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}
