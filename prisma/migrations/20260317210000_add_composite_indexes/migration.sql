-- DropIndex si nécessaire (les unique existent déjà)

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlatformConfig_platform_userId_idx" ON "PlatformConfig"("platform", "userId");
CREATE INDEX IF NOT EXISTS "SpotifyConfig_userId_idx" ON "SpotifyConfig"("userId");
CREATE INDEX IF NOT EXISTS "AlertConfig_platform_userId_idx" ON "AlertConfig"("platform", "userId");
CREATE INDEX IF NOT EXISTS "SpotifyToken_userId_idx" ON "SpotifyToken"("userId");
CREATE INDEX IF NOT EXISTS "InviteToken_userId_idx" ON "InviteToken"("userId");
