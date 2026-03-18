'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Card,
  Input,
  Flex,
  Spinner,
  IconButton,
  Clipboard,
  InputGroup,
  Table,
  Stack,
} from '@chakra-ui/react'
import { FiUserPlus, FiTrash2, FiArrowLeft, FiCopy, FiCheck, FiRefreshCw } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import Link from 'next/link'

interface UserItem {
  id: string
  username: string
  role: string
  createdAt: string
  status: 'active' | 'pending'
  inviteToken: {
    token: string
    usedAt: string | null
    expiresAt: string
  } | null
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <IconButton
      aria-label="Copier"
      size="xs"
      variant="ghost"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <FiCheck /> : <FiCopy />}
    </IconButton>
  )
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newUsername, setNewUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [lastInviteUrl, setLastInviteUrl] = useState('')
  const [successInfo, setSuccessInfo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (e) {
      console.error('Error fetching users', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLastInviteUrl('')
    setSuccessInfo('')

    if (!newUsername.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création.')
        return
      }

      const url = `${window.location.origin}/invite/${data.inviteToken}`
      setLastInviteUrl(url)
      setSuccessInfo('Utilisateur créé ! Envoyez ce lien d\'invitation :')
      setNewUsername('')
      fetchUsers()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('{t("admin.confirmDelete")}')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      fetchUsers()
    } catch (e) {
      console.error('Error deleting user', e)
    } finally {
      setDeletingId(null)
    }
  }

  const handleReset = async (id: string, username: string) => {
    if (!confirm(`{t("admin.resetPassword")} de ${username} ? Il devra en définir un nouveau.`)) return
    setResettingId(id)
    setError('')
    setLastInviteUrl('')
    setSuccessInfo('')
    
    try {
      const res = await fetch(`/api/admin/users/${id}/reset`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation.')
        return
      }
      
      const url = `${window.location.origin}/invite/${data.inviteToken}`
      setLastInviteUrl(url)
      setSuccessInfo(`Mot de passe réinitialisé pour ${username}. Envoyez ce lien :`)
      fetchUsers()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setResettingId(null)
    }
  }

  if (loading) {
    return (
      <Flex minH="50vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="5xl" py={8}>
        {/* Header */}
        <HStack mb={8} justify="space-between" flexWrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <HStack gap={3}>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <FiArrowLeft /> Retour
                </Link>
              </Button>
              <Heading size="2xl">👥 Administration</Heading>
            </HStack>
            <Text color="gray.400" fontSize="sm">
              {t("admin.subtitle")}
            </Text>
          </VStack>
        </HStack>

        {/* Create user form */}
        <Card.Root mb={6} bg="white" _dark={{ bg: 'gray.800' }} shadow="sm" borderRadius="xl">
          <Card.Header>
            <Heading size="md">{t("admin.createUser")}</Heading>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleCreate}>
              <Stack direction={{ base: 'column', sm: 'row' }} gap={3} align="end">
                <Field label="Nom d'utilisateur" flex={1}>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ex: streamer42"
                    autoComplete="off"
                  />
                </Field>
                <Button
                  type="submit"
                  colorPalette="blue"
                  loading={creating}
                  loadingText="Création..."
                >
                  <FiUserPlus /> Créer
                </Button>
              </Stack>
            </form>

            {error && (
              <Text color="red.500" fontSize="sm" mt={3}>
                {error}
              </Text>
            )}

            {lastInviteUrl && (
              <Box
                mt={4}
                p={4}
                bg="green.50"
                _dark={{ bg: 'green.900' }}
                borderRadius="lg"
                border="1px solid"
                borderColor="green.200"
              >
                <Text fontSize="sm" fontWeight="semibold" color="green.700" _dark={{ color: 'green.200' }} mb={2}>
                  ✅ {successInfo || 'Opération réussie ! Envoyez ce lien :'}
                </Text>
                <HStack>
                  <Input
                    value={lastInviteUrl}
                    readOnly
                    fontFamily="mono"
                    fontSize="xs"
                    size="sm"
                  />
                  <CopyButton value={lastInviteUrl} />
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  {t("admin.inviteLinkExpires")}
                </Text>
              </Box>
            )}
          </Card.Body>
        </Card.Root>

        {/* Users table */}
        <Card.Root bg="white" _dark={{ bg: 'gray.800' }} shadow="sm" borderRadius="xl">
          <Card.Header>
            <HStack justify="space-between">
              <Heading size="md">Utilisateurs ({users.length})</Heading>
            </HStack>
          </Card.Header>
          <Card.Body p={0}>
            {users.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="gray.400">Aucun utilisateur créé.</Text>
              </Box>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader pl={6}>Utilisateur</Table.ColumnHeader>
                    <Table.ColumnHeader>{t("admin.status")}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t("admin.role")}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t("admin.createdAt")}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right" pr={6}>{t("admin.actions")}</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell pl={6} fontWeight="medium">
                        {user.username}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={user.status === 'active' ? 'green' : 'orange'}
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                        >
                          {user.status === 'active' ? 'Actif' : 'En attente'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="outline" borderRadius="full" px={2}>
                          {user.role}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell color="gray.500" fontSize="sm">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </Table.Cell>
                      <Table.Cell textAlign="right" pr={6}>
                        <HStack justify="flex-end" gap={2}>
                          {user.role !== 'admin' && (
                            <IconButton
                              aria-label="Réinitialiser mdp"
                              size="sm"
                              variant="ghost"
                              colorPalette="orange"
                              onClick={() => handleReset(user.id, user.username)}
                              loading={resettingId === user.id}
                              title="{t("admin.resetPassword")}"
                            >
                              <FiRefreshCw />
                            </IconButton>
                          )}
                          <IconButton
                            aria-label="Supprimer"
                            size="sm"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => handleDelete(user.id)}
                            loading={deletingId === user.id}
                          >
                            <FiTrash2 />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  )
}
