'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ONE_HOUR = 60 * 60 * 1000
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

export async function login(prevState: { error: string } | null, formData: FormData) {
  const password = formData.get('password') as string
  const rememberMe = formData.get('rememberMe') === 'on'

  if (password === process.env.ADMIN_PASSWORD) {
    const expires = new Date(Date.now() + (rememberMe ? THIRTY_DAYS : ONE_HOUR))
    const cookieStore = await cookies()

    cookieStore.set('session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expires,
      sameSite: 'lax',
      path: '/',
    })

    redirect('/dashboard')
  } else {
    return { error: 'Invalid password' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}
