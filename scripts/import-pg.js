const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  const data = JSON.parse(fs.readFileSync('./migration_data.json', 'utf-8'));

  if (data.users && data.users.length > 0) await prisma.user.createMany({ data: data.users });
  if (data.inviteTokens && data.inviteTokens.length > 0) await prisma.inviteToken.createMany({ data: data.inviteTokens });
  if (data.platformConfigs && data.platformConfigs.length > 0) await prisma.platformConfig.createMany({ data: data.platformConfigs });
  if (data.spotifyConfigs && data.spotifyConfigs.length > 0) await prisma.spotifyConfig.createMany({ data: data.spotifyConfigs });
  if (data.spotifyTokens && data.spotifyTokens.length > 0) await prisma.spotifyToken.createMany({ data: data.spotifyTokens });
  if (data.alertConfigs && data.alertConfigs.length > 0) await prisma.alertConfig.createMany({ data: data.alertConfigs });

  console.log("Migration complète.");
  
  // Clean up
  if (fs.existsSync('./migration_data.json')) {
    fs.unlinkSync('./migration_data.json');
  }
}

main().catch(e => {
  console.error("Import error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
