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

## Installation et Démarrage

1. **Installer les dépendances** :

   ```bash
   pnpm install
   ```

2. **Configuration de la Base de Données** :
   Générez le client Prisma et initialisez la base de données SQLite locale :

   ```bash
   pnpm dlx prisma generate
   pnpm dlx prisma db push
   ```

3. **Lancer le serveur de développement** :

   ```bash
   pnpm dev
   ```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.
5. **Connexion** : Connectez-vous avec le mot de passe administrateur défini dans votre variable d'environnement `ADMIN_PASSWORD`.

## Configuration OBS

L'application intègre un système d'authentification robuste pour OBS.

1. Allez sur le **Dashboard** ou la section **Alertes** de votre interface.
2. Copiez l'URL de l'overlay OBS générée pour le widget désiré.
3. Dans OBS, ajoutez une **Source Navigateur** et collez l'URL.
   - Dimensions recommandées :
     - Spotify : 600x200
     - Chat Twitch / YouTube : 400x600
     - Alertes : 1920x1080
4. Le fond transparent et les styles s'appliquent automatiquement grâce à l'application.

_Note : Gardez vos URLs d'overlay privées. Elles contiennent un jeton de sécurité (`?token=...`) qui autorise la source OBS à s'authentifier localement._

## Technologies Utilisées

- **Framework** : Next.js (App Router)
- **Interface** : Chakra UI
- **Base de données** : Prisma ORM avec SQLite
- **APIs** : Twitch API (tmi.js), Spotify Web API, YouTube.
- **Temps Réel** : Server-Sent Events (SSE) pour les alertes.
