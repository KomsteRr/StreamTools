-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotifyToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "SpotifyToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotifyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "SpotifyConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "PlatformConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'twitch',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "soundUrl" TEXT,
    "imageUrl" TEXT,
    "bgMediaUrl" TEXT,
    "bgMediaType" TEXT,
    "text" TEXT NOT NULL DEFAULT '{user}',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "fontSize" INTEGER NOT NULL DEFAULT 28,
    "glowColor" TEXT NOT NULL DEFAULT '#6441a5',
    "glowSize" INTEGER NOT NULL DEFAULT 0,
    "borderColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderWidth" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "volume" REAL NOT NULL DEFAULT 0.8,
    "bgColor" TEXT NOT NULL DEFAULT '#6441a5',
    "bgOverlayOpacity" REAL NOT NULL DEFAULT 0.4,
    "position" TEXT NOT NULL DEFAULT 'center',
    "animation" TEXT NOT NULL DEFAULT 'slide-in',
    "exitAnimation" TEXT NOT NULL DEFAULT 'fade',
    "containerImageUrl" TEXT,
    "containerWidth" INTEGER NOT NULL DEFAULT 400,
    "containerHeight" INTEGER NOT NULL DEFAULT 200,
    "containerLayout" TEXT NOT NULL DEFAULT 'column',
    "textAlign" TEXT NOT NULL DEFAULT 'center',
    "imageSize" INTEGER NOT NULL DEFAULT 80,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "userId" TEXT,
    CONSTRAINT "AlertConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyConfig_key_userId_key" ON "SpotifyConfig"("key", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfig_platform_key_userId_key" ON "PlatformConfig"("platform", "key", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfig_type_platform_userId_key" ON "AlertConfig"("type", "platform", "userId");
