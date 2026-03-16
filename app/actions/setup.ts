"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function submitSetup(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé" };
  }

  try {
    const dbType = (formData.get("db_type") as string) || "sqlite";
    const databaseUrl = (formData.get("database_url") as string) || "";
    const spotifyRedirectUri = (formData.get("spotify_redirect_uri") as string) || "";
    const twitchBotActive = formData.get("twitch_bot_active") === "true" ? "true" : "false";
    const twitchBotUsername = (formData.get("twitch_bot_username") as string) || "";
    const twitchBotToken = (formData.get("twitch_bot_token") as string) || "";

    const twitchActive = formData.get("twitch_active") === "true" ? "true" : "false";
    const ytActive = formData.get("youtube_active") === "true" ? "true" : "false";
    const spotifyActive = formData.get("spotify_active") === "true" ? "true" : "false";

    // Build the bulk upsert promises for global configs (userId: null)
    const configsToSave = [
      { platform: "system", key: "db_type", value: dbType },
      { platform: "system", key: "database_url", value: dbType === "postgres" ? databaseUrl : "" },
      { platform: "system", key: "twitch_active", value: twitchActive },
      { platform: "system", key: "youtube_active", value: ytActive },
      { platform: "system", key: "spotify_active", value: spotifyActive },
      { platform: "spotify", key: "redirect_uri", value: spotifyRedirectUri },
      { platform: "twitch", key: "bot_active", value: twitchBotActive },
      { platform: "twitch", key: "bot_username", value: twitchBotUsername },
      { platform: "twitch", key: "bot_token", value: twitchBotToken },
      { platform: "system", key: "setup_complete", value: "true" },
    ];

    for (const c of configsToSave) {
      const existing = await prisma.platformConfig.findFirst({
        where: { platform: c.platform, key: c.key, userId: null },
      });

      if (existing) {
        await prisma.platformConfig.update({
          where: { id: existing.id },
          data: { value: c.value },
        });
      } else {
        await prisma.platformConfig.create({
          data: {
            platform: c.platform,
            key: c.key,
            value: c.value,
            userId: null,
          },
        });
      }
    }

    if (dbType === "postgres" && databaseUrl) {
      const fs = require("fs");
      const path = require("path");
      
      const data = {
        users: await prisma.user.findMany(),
        inviteTokens: await prisma.inviteToken.findMany(),
        platformConfigs: await prisma.platformConfig.findMany(),
        spotifyConfigs: await prisma.spotifyConfig.findMany(),
        spotifyTokens: await prisma.spotifyToken.findMany(),
        alertConfigs: await prisma.alertConfig.findMany(),
      };
      
      fs.writeFileSync(path.join(process.cwd(), "migration_data.json"), JSON.stringify(data));

      const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
      let schema = fs.readFileSync(schemaPath, "utf-8");
      if (schema.includes('provider = "sqlite"')) {
        schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
        fs.writeFileSync(schemaPath, schema);
      }

      const envLocalPath = path.join(process.cwd(), ".env.local");
      let envLocal = "";
      if (fs.existsSync(envLocalPath)) {
        envLocal = fs.readFileSync(envLocalPath, "utf-8");
      }
      
      if (envLocal.includes("DATABASE_URL=")) {
         // replace existing line entirely
         envLocal = envLocal.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
      } else {
         envLocal += `\nDATABASE_URL="${databaseUrl}"\n`;
      }
      fs.writeFileSync(envLocalPath, envLocal);

      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      try {
        await execAsync("npx prisma generate");
        await execAsync("npx prisma db push --accept-data-loss");
        await execAsync("node scripts/import-pg.js");
      } catch (e) {
        console.error("Migration error:", e);
        return { error: "Erreur lors de la migration vers PostgreSQL." };
      }

      return { success: "Setup terminé et Migration vers PostgreSQL réussie ! IMPORTANT: Veuillez fermer la console de votre serveur Vercel/Node.js et relancer 'nr dev' (ou npm run dev) pour finaliser l'opération." };
    }

  } catch (error) {
    console.error("Setup error:", error);
    return { error: "Une erreur est survenue lors de l'enregistrement." };
  }

  redirect("/dashboard");
}
