'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSessionValue } from '@/lib/session'

const ONE_HOUR = 60 * 60 * 1000
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

export async function login(prevState: { error: string } | null, formData: FormData) {
  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string
  const rememberMe = formData.get('rememberMe') === 'on'

  if (!username || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  const expires = new Date(Date.now() + (rememberMe ? THIRTY_DAYS : ONE_HOUR))

  // ── Admin login (password from env) ─────────────────────────────────────────
  if (username.toLowerCase() === 'admin') {
    if (password !== process.env.ADMIN_PASSWORD) {
      return { error: 'Mot de passe incorrect.' }
    }

    // 1. Ensure the admin user exists in the DB with a unique ID
    let adminUser = null
    try {
      adminUser = await prisma.user.findUnique({ where: { username: 'admin' } })
    } catch (error: any) {
      if (error.code === 'P2021') {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        try {
          console.log('Base de données non initialisée (P2021). Lancement de prisma db push...')
          await execAsync('npx prisma db push')
          console.log('Base de données initialisée avec succès.')
          adminUser = await prisma.user.findUnique({ where: { username: 'admin' } })
        } catch (pushError) {
          console.error('Erreur lors de l\'initialisation de la base de données:', pushError)
          return { error: 'Erreur critique lors de l\'initialisation de la base de données.' }
        }
      } else {
        console.error('Erreur lors de la vérification de l\'admin:', error)
        return { error: 'Erreur de connexion à la base de données.' }
      }
    }

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          role: 'admin',
          passwordHash: await bcrypt.hash(password, 10), // Optional: store a hash even though we authenticate via ENV
        },
      })
    }

    // 2. Check if setup is complete (global config, userId: null)
    const setupConfig = await prisma.platformConfig.findFirst({
      where: { platform: 'system', key: 'setup_complete', userId: null },
    })

    const sessionValue = await createSessionValue(adminUser.id, 'admin')
    const cookieStore = await cookies()
    cookieStore.set('session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      sameSite: 'lax',
      path: '/',
    })

    if (!setupConfig || setupConfig.value !== 'true') {
      redirect('/admin/setup')
    } else {
      redirect('/dashboard')
    }
  }

  // ── Regular user login ─────────────────────────────────────────────────────
  let user = null
  try {
    user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } })
  } catch (error: any) {
    if (error.code === 'P2021') {
      return { error: 'Le système n\'a pas encore été configuré. Veuillez vous connecter en tant qu\'administrateur en premier.' }
    }
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

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}
