# Direct Aid Burundi

Site de présentation, dons ponctuels et mensuels, promesses de virement, projets de puits, sacrifices, administration et témoignages de donateurs.

## Démarrage local
Node.js 22.13 ou ultérieur.
```sh
npm ci
```
Créer un fichier `.env.local` ignoré par Git :
```dotenv
APP_MODE=live
SITE_URL=http://127.0.0.1:5173
TURSO_DATABASE_URL=file:.data/directaid.db
```
Puis :
```sh
npm run db:migrate
npm run admin:setup
npm run dev
```
Le provisionnement admin reçoit sur son entrée standard un JSON contenant `email` et `password`. Il masque la saisie dans un terminal et conserve un compte déjà créé. Ne pas mettre le mot de passe dans une commande, dans le dépôt ou dans un fichier partagé. Le compte prévu est `nahimana1996@gmail.com`. L'initialisation doit être faite sur la base cible avant sa mise en service.

Connexion : `/admin/connexion`. Modification du mot de passe : administration, onglet **Sécurité**. Les sessions durent huit heures ; changer le mot de passe invalide les autres sessions. Les mots de passe sont hachés avec un sel aléatoire et PBKDF2-SHA256 à 600 000 itérations. Les en-têtes d'identité ChatGPT ne sont jamais utilisés.

## Vercel
Importer ce dépôt avec **Next.js** comme framework. Si le dépôt contient directement ce dossier, racine `./` ; s'il contient le dossier `site`, racine `site`. Build : `npm run build`. Laisser le répertoire de sortie automatique. Ne pas déployer comme un export statique.

Configurer dans Vercel les variables serveur décrites dans `.env.example` :
- `SITE_URL` : URL HTTPS définitive.
- `APP_MODE=live`.
- `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` : base persistante **libSQL** sur Turso ; aucun fichier SQLite local sur Vercel.
- `BLOB_READ_WRITE_TOKEN` : magasin **privé** Vercel Blob pour les photos. L'API contrôle l'accès aux preuves et aux images publiées.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- `RESEND_API_KEY`, `EMAIL_FROM` : adresse d'envoi validée chez Resend.
- `CRON_SECRET` : secret aléatoire protégeant le traitement quotidien des e-mails et des relances.

Appliquer `npm run db:migrate` à la base distante depuis un environnement de confiance, puis provisionner le compte administrateur sur cette même base. Les migrations s'exécutent une fois, dans l'ordre, avec vérification de leur empreinte ; elles ne sont pas déclenchées lors de chaque requête ou build. Ne pas mélanger une base de test avec la base de production.

Un passage depuis le site hébergé précédent nécessite un export de ses données et une copie des photos vers le nouveau stockage. Le projet ne transfère pas automatiquement les données ou les comptes du précédent hébergement.

Le cron de `vercel.json` appelle chaque jour `GET /api/jobs/reminders` à 07:00 UTC. Chaque promesse reçoit au maximum quatre relances, espacées d'au moins sept jours. Vercel transmet `CRON_SECRET` dans l'en-tête Authorization. Les crons fonctionnent sur les déploiements de production.

Ajouter chez Stripe le webhook `https://votre-domaine/api/stripe/webhook` avec les événements :
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `charge.refunded`.
Dans l'administration, confirmer les tarifs, les coordonnées bancaires et les contenus avant d'activer la collecte. Les règlements et e-mails réels restent indisponibles tant que leurs clés ne sont pas configurées.

Les images JPG, PNG et WebP sont limitées à **4 Mo** pour respecter la limite de taille des fonctions Vercel. Les photos de preuve restent privées. Les avis nécessitent un don réglé, un e-mail de preuve envoyé, le consentement du donateur et la validation de l'administrateur.

## Vérification
```sh
npx tsc --noEmit
npm run build
```
Aucune clé, base locale, photo de preuve privée ou donnée de donateur ne doit être poussée dans Git.

Documentation officielle : [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Turso et Vercel](https://docs.turso.tech/integrations/vercel), [Vercel Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk), [crons Vercel](https://vercel.com/docs/cron-jobs/quickstart).
