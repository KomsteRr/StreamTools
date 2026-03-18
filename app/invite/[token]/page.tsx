'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { LoginBackground } from '@/app/components/login-background'

type PageStatus = 'loading' | 'ready' | 'submitting' | 'success' | 'error'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const token = params.token as string

  const [status, setStatus] = useState<PageStatus>('ready')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 12) {
      setError(t('invite.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('invite.passwordMismatch'))
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/invite/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
        setStatus(res.status === 404 || res.status === 410 ? 'error' : 'ready')
        return
      }

      setUsername(data.username)
      setStatus('success')
    } catch {
      setError('Erreur réseau.')
      setStatus('ready')
    }
  }

  if (status === 'loading') {
    return (
      <Flex minH="100vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    )
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" pos="relative">
      <LoginBackground />
      <Container
        maxW="sm"
        p={8}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        boxShadow="lg"
        zIndex="1"
        pos="relative"
      >
        {status === 'success' ? (
          <Stack gap={4} align="center" textAlign="center">
            <Heading size="lg">✅ Compte activé !</Heading>
            <Text color="gray.500">
              Votre compte <strong>{username}</strong> est prêt. Vous pouvez maintenant vous connecter.
            </Text>
            <Button
              colorPalette="blue"
              width="full"
              onClick={() => router.push('/login')}
            >
              Se connecter
            </Button>
          </Stack>
        ) : status === 'error' ? (
          <Stack gap={4} align="center" textAlign="center">
            <Heading size="lg">❌ Lien invalide</Heading>
            <Text color="gray.500">{error}</Text>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Retour à la connexion
            </Button>
          </Stack>
        ) : (
          <Stack gap={6} align="center">
            <Heading as="h1" size="xl" textAlign="center">
              Activer votre compte
            </Heading>
            <Text color="gray.500" textAlign="center" fontSize="sm">
              Définissez votre mot de passe pour commencer à utiliser l&apos;application.
            </Text>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Stack gap={4}>
                <Field label={t('common.password')}>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Choisissez un mot de passe"
                  />
                </Field>

                <Field label=t('common.confirmPassword')>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder=t('common.confirmPasswordPlaceholder')
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.form?.requestSubmit()
                      }
                    }}
                  />
                </Field>

                {error && (
                  <Text color="red.500" fontSize="sm">{error}</Text>
                )}

                <Button
                  type="submit"
                  colorPalette="blue"
                  width="full"
                  loading={status === 'submitting'}
                  loadingText="Activation..."
                >
                  Activer mon compte
                </Button>
              </Stack>
            </form>
          </Stack>
        )}
      </Container>
    </Box>
  )
}
