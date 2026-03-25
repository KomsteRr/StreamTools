# Stream All-in-One Tools

Un tableau de bord complet et une suite d'outils pour les streamers, développé avec [Next.js](https://nextjs.org/), Prisma (SQLite) et Chakra UI.

## Fonctionnalités

- **Dashboard Centralisé** : Un panneau de contrôle unique pour gérer tous vos assets et services liés au stream.
- **Intégration Spotify** :
  - **Overlay Now Playing** : Affiche la chanson en cours d'écoute avec un design "glassmorphism" personnalisable.
  - **Configuration Dynamique** : Modifiez les couleurs, les bordures et gérez l'authentification en toute sécurité.
- **Intégration Twitch** :
  - **Overlay de Chat** : Chat transparent avec support des badges, emotes et paramètres de typographie.
  - **Gestion du Bot** : Liez votre chaîne et configurez les accès de votre bot de manière sécurisée.
- **Intégration YouTube** :
  - **Support du Chat** : Génération de code CSS sur-mesure pour intégrer le chat officiel YouTube.
- **Alertes de Stream** :
  - Notifications en direct pour les follows, abonnements, bits, raids, etc.
  - Upload de médias (sons, images, vidéos) et personnalisation approfondie des animations par alerte.
- **Architecture Sécurisée** : Les overlays OBS sont protégés par un système de token cryptographique pour empêcher l'exposition de vos secrets et mots de passe.

---

## Installation (développement local)

1. **Installer les dépendances** :

   ```bash
   pnpm install
   ```

2. **Configurer les variables d'environnement** :

   ```bash
   cp .env.example .env
   # Éditez .env avec vos valeurs
   ```

3. **Initialiser la base de données** :

   ```bash
   pnpm dlx prisma generate
   pnpm dlx prisma db push
   ```

4. **Lancer le serveur de développement** :

   ```bash
   pnpm dev
   ```

5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.  
   **Connexion** : utilisez le mot de passe défini dans `ADMIN_PASSWORD`.

---

## Déploiement avec Docker

### Variables d'environnement

Créez un fichier `.env` en vous basant sur `.env.example` :

| Variable               | Description                                                    | Obligatoire |
|------------------------|----------------------------------------------------------------|:-----------:|
| `SESSION_SECRET`       | Clé HMAC-SHA256 pour les cookies de session (256 bits)         | ✅          |
| `ADMIN_PASSWORD`       | Mot de passe admin (haché bcrypt au premier login)             | ✅          |
| `DATABASE_URL`         | Chemin SQLite, ex. `file:/data/prod.db`                        | ✅          |
| `SPOTIFY_CLIENT_ID`    | ID client de votre application Spotify                         | ❌          |
| `SPOTIFY_CLIENT_SECRET`| Secret client de votre application Spotify                     | ❌          |
| `SPOTIFY_REDIRECT_URI` | URI de callback Spotify                                        | ❌          |

### Build & Run (ligne de commande)

```bash
# Construire l'image
docker build -t stream-allin-tools .

# Lancer le conteneur
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/data \
  -e DATABASE_URL="file:/data/prod.db" \
  -e SESSION_SECRET="votre-secret-256-bits" \
  -e ADMIN_PASSWORD="votre-mot-de-passe" \
  --name stream-allin-tools \
  stream-allin-tools
```

> **Important :** montez toujours un volume sur `/data` pour persister la base SQLite entre les redémarrages.

### Docker Compose (recommandé)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    env_file:
      - .env
    restart: unless-stopped
```

```bash
docker compose up -d
```

---

## Configuration OBS

1. Allez sur le **Dashboard** ou la section **Alertes** de votre interface.
2. Copiez l'URL de l'overlay OBS générée pour le widget désiré.
3. Dans OBS, ajoutez une **Source Navigateur** et collez l'URL.
   - Dimensions recommandées :
     - Spotify : 600 × 200
     - Chat Twitch / YouTube : 400 × 600
     - Alertes : 1920 × 1080
4. Le fond transparent et les styles s'appliquent automatiquement.

> **Sécurité :** gardez vos URLs d'overlay privées. Elles contiennent un jeton (`?token=...`) qui permet à OBS de s'authentifier.

---

## Technologies Utilisées

| Catégorie       | Technologie                              |
|-----------------|------------------------------------------|
| Framework       | Next.js 16 (App Router)                  |
| Interface       | Chakra UI + Framer Motion                |
| Base de données | Prisma ORM + SQLite                      |
| APIs            | Twitch (tmi.js), Spotify Web API, YouTube|
| Temps réel      | Server-Sent Events (SSE)                 |
| Auth            | Cookies HMAC-SHA256 + bcrypt             |
