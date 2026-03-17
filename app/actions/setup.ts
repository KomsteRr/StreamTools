'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'

export async function submitSetup(prevState: any, formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Non autorisé' }
  }

  try {
    const twitchActive = formData.get('twitch_active') === 'true' ? 'true' : 'false'
    const ytActive = formData.get('youtube_active') === 'true' ? 'true' : 'false'
    const spotifyActive = formData.get('spotify_active') === 'true' ? 'true' : 'false'
    const spotifyRedirectUri = (formData.get('spotify_redirect_uri') as string) || ''
    const twitchBotActive = formData.get('twitch_bot_active') === 'true' ? 'true' : 'false'
    const twitchBotUsername = (formData.get('twitch_bot_username') as string) || ''
    const twitchBotToken = (formData.get('twitch_bot_token') as string) || ''
    const databaseUrl = (formData.get('database_url') as string) || ''

    const configsToSave = [
      { platform: 'system', key: 'twitch_active', value: twitchActive },
      { platform: 'system', key: 'youtube_active', value: ytActive },
      { platform: 'system', key: 'spotify_active', value: spotifyActive },
      { platform: 'spotify', key: 'redirect_uri', value: spotifyRedirectUri },
      { platform: 'twitch', key: 'bot_active', value: twitchBotActive },
      { platform: 'twitch', key: 'bot_username', value: twitchBotUsername },
      { platform: 'twitch', key: 'bot_token', value: twitchBotToken },
      { platform: 'system', key: 'setup_complete', value: 'true' },
    ]

    for (const c of configsToSave) {
      const existing = await prisma.platformConfig.findFirst({
        where: { platform: c.platform, key: c.key, userId: null },
      })
      if (existing) {
        await prisma.platformConfig.update({
          where: { id: existing.id },
          data: { value: c.value },
        })
      } else {
        await prisma.platformConfig.create({
          data: { platform: c.platform, key: c.key, value: c.value, userId: null },
        })
      }
    }

    // Handle PostgreSQL migration request
    if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
      const pendingMigration = {
        databaseUrl,
        timestamp: new Date().toISOString(),
        requestedBy: session.userId || 'admin',
      }
      const migrationPath = path.join(process.cwd(), 'pending-migration.json')
      fs.writeFileSync(migrationPath, JSON.stringify(pendingMigration, null, 2))
      return {
        message: 'Configuration sauvegardée. Redémarrez le serveur avec `npm run migrate` pour finaliser la migration vers PostgreSQL.',
      }
    }
  } catch (error) {
    console.error('Setup error:', error)
    return { error: 'Une erreur est survenue lors de l\'enregistrement.' }
  }

  redirect('/dashboard')
}
