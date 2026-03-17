const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  let databaseUrl = args[0] || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Usage: npx tsx scripts/migrate-db.ts <DATABASE_URL>');
    console.error('   or: DATABASE_URL=... npx tsx scripts/migrate-db.ts');
    process.exit(1);
  }

  // Check for pending migration stored in PlatformConfig
  const { PrismaClient: PrismaClientCheck } = require('@prisma/client');
  const checkClient = new PrismaClientCheck();
  try {
    const pending = await checkClient.platformConfig.findFirst({
      where: { platform: 'system', key: 'pending_migration', userId: null }
    });
    if (pending) {
      databaseUrl = pending.value;
      console.log('ℹ️  Migration URL trouvée dans PlatformConfig.');
      await checkClient.platformConfig.delete({ where: { id: pending.id } });
      console.log('   ✅ Entrée pending_migration supprimée.');
    }
  } catch (e) {
    // PlatformConfig table might not exist yet, that's ok
  }
  await checkClient.$disconnect();

  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.join(rootDir, '.env.local');

  // Read or create .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  if (!isPostgres) {
    // SQLite mode — just update .env.local
    const lines = envContent.split('\n');
    const filtered = lines.filter(l => !l.startsWith('DATABASE_URL='));
    filtered.push(`DATABASE_URL=${databaseUrl}`);
    fs.writeFileSync(envPath, filtered.join('\n'));
    console.log('✅ .env.local mis à jour avec la DATABASE_URL SQLite.');
    console.log('   Relancez le serveur pour appliquer les changements.');
    return;
  }

  // PostgreSQL migration
  console.log('🔄 Migration SQLite → PostgreSQL...\n');

  // Step 1: Export data from current (SQLite) database
  console.log('📦 Exportation des données depuis SQLite...');
  const { PrismaClient } = require('@prisma/client');
  // Read the CURRENT database URL from .env.local before modifying it
  const currentDbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=').slice(1).join('=') || process.env.DATABASE_URL;
  const prisma = new PrismaClient({ datasources: { db: { url: currentDbUrl } } });

  const data = {
    users: await prisma.user.findMany(),
    inviteTokens: await prisma.inviteToken.findMany(),
    platformConfigs: await prisma.platformConfig.findMany(),
    spotifyConfigs: await prisma.spotifyConfig.findMany(),
    spotifyTokens: await prisma.spotifyToken.findMany(),
    alertConfigs: await prisma.alertConfig.findMany(),
  };
  await prisma.$disconnect();

  const migrationDataPath = path.join(rootDir, 'migration_data.json');
  fs.writeFileSync(migrationDataPath, JSON.stringify(data, null, 2));
  console.log(`   ✅ ${Object.values(data).flat().length} enregistrements exportés vers migration_data.json\n`);

  // Step 2: Update prisma/schema.prisma to use postgresql
  console.log('📝 Mise à jour de prisma/schema.prisma...');
  const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf-8');
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
  console.log('   ✅ provider changé en "postgresql"\n');

  // Step 3: Update .env.local
  console.log('📝 Mise à jour de .env.local...');
  const lines = envContent.split('\n');
  const filtered = lines.filter(l => !l.startsWith('DATABASE_URL='));
  filtered.push(`DATABASE_URL=${databaseUrl}`);
  fs.writeFileSync(envPath, filtered.join('\n'));
  console.log('   ✅ DATABASE_URL mise à jour\n');

  // Step 4: Regenerate Prisma client and push schema
  console.log('⚙️  Génération du client Prisma et push du schéma...');
  execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });
  execSync('npx prisma db push --accept-data-loss', { cwd: rootDir, stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });
  console.log('   ✅ Schéma PostgreSQL appliqué\n');

  // Step 5: Import data using the existing script
  console.log('📥 Import des données dans PostgreSQL...');
  execSync('node scripts/import-pg.js', { cwd: rootDir, stdio: 'inherit' });
  console.log('\n✅ Migration terminée avec succès !');
  console.log('   Relancez le serveur avec: npm run dev');
}

main().catch(e => {
  console.error('❌ Erreur de migration:', e);
  process.exit(1);
});
