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
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `charge.refunded`, `customer.subscription.updated`, `customer.subscription.deleted`.
Dans l'administration, confirmer les tarifs, les coordonnées bancaires et les contenus avant d'activer la collecte. Les règlements et e-mails réels restent indisponibles tant que leurs clés ne sont pas configurées.

Les images JPG, PNG et WebP sont limitées à **4 Mo** pour respecter la limite de taille des fonctions Vercel. Les photos de preuve restent privées. Les avis nécessitent un don réglé, un e-mail de preuve envoyé, le consentement du donateur et la validation de l'administrateur.

## Vérification
```sh
npx tsc --noEmit
npm run build
```
Aucune clé, base locale, photo de preuve privée ou donnée de donateur ne doit être poussée dans Git.

Documentation officielle : [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Turso et Vercel](https://docs.turso.tech/integrations/vercel), [Vercel Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk), [crons Vercel](https://vercel.com/docs/cron-jobs/quickstart).

## Pages publiques et gestion des contenus

L’administration propose les onglets **À propos & FAQ**, **Réalisations** et **Campagnes**. Les informations de l’équipe, l’histoire, l’adresse, les agréments, les documents officiels, les réseaux sociaux et les textes complémentaires restent à renseigner par l’association. La section « Ils nous font confiance » reprend les trois organismes et les textes fournis par l’association dans sa capture de référence ; ils sont modifiables dans le même onglet. Aucun résultat chiffré ou témoignage fictif n’est créé.

Les réalisations ont une date, un lieu, une cause, un bilan et des photos. Les campagnes ont un objectif en euros, une période et une cause ; les campagnes de puits désignent un projet publié. Brouillons et images non publiées restent réservés aux administrateurs. Les photos privées des donateurs ne peuvent pas être réutilisées directement comme photos publiques. Les PDF officiels (4 Mo maximum) sont proposés au téléchargement.

Les fonds collectés pour une campagne proviennent des paiements confirmés hors démonstration, sans compter les promesses ni les remboursements. Le serveur refuse les nouveaux dons d’une campagne non publiée, hors période ou associée à une autre cause. Une campagne ayant reçu des contributions conserve sa cause et son projet de puits.

Le footer conserve la langue choisie, comprend les contacts configurés dans les réglages et ne présente aucun lien administrateur. Les réseaux sociaux s’affichent uniquement après ajout de leurs URL officielles. Les pages d’information ne remplacent pas la validation des renseignements légaux de l’association avant publication.

## Espace donateur et récupération de compte

`/espace-donateur` demande l’adresse utilisée pour les dons. Un lien par e-mail valable **15 minutes**, à usage unique, permet d’ouvrir une session privée de 24 heures. Il regroupe uniquement les contributions de l’adresse vérifiée, les paiements, les liens de suivi et les preuves associées. Le jeton est dans le fragment du lien, puis retiré après utilisation ; il n’est pas renvoyé par l’API de demande. Les réponses ne révèlent pas l’existence d’une adresse. Limitation de cinq demandes par adresse et par IP, par période de 15 minutes.

`/admin/mot-de-passe-oublie` utilise également un lien temporaire à usage unique. Une réinitialisation invalide les autres liens de réinitialisation et toutes les sessions administrateur. Aucun lien de récupération n’est fourni dans les journaux ou une réponse publique. Resend et l’adresse d’envoi doivent être configurés pour ces fonctionnalités, y compris en développement ; aucun envoi fictif n’est présenté comme réussi lorsque le service est absent.

Pour la gestion de carte et d’abonnement, activer le **portail client dans Stripe**, avec modification du moyen de paiement et annulation d’abonnement. Le serveur crée la session de portail à partir d’une contribution appartenant au donateur connecté. Les événements `customer.subscription.updated` et `customer.subscription.deleted` synchronisent son état. [Documentation Stripe du portail](https://docs.stripe.com/api/customer_portal/sessions/create).

L’onglet **À traiter** regroupe les virements à confirmer, les dons réglés sans e-mail de preuve envoyé, les sacrifices réglés dont la date reste à confirmer et les e-mails en échec. La vue porte sur les dernières 500 contributions / 200 e-mails ; l’export CSV contient toutes les contributions, protège les cellules contre l’interprétation de formules et s’ouvre dans Excel. Il ne constitue pas un export des seuls encaissements : la colonne statut distingue les paiements, promesses et annulations.

## Sauvegardes chiffrées et restauration

Le workflow `.github/workflows/backup.yml` prépare une sauvegarde quotidienne à **03:20 UTC**, ainsi qu’un déclenchement manuel. Il ne sera actif qu’après publication du dépôt sur GitHub, activation des Actions et configuration de ces secrets :

- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` : base source.
- `BLOB_READ_WRITE_TOKEN` : stockage privé des images et documents source.
- `BACKUP_BLOB_READ_WRITE_TOKEN` : autre magasin Blob **privé**, réservé aux sauvegardes.
- `BACKUP_ENCRYPTION_KEY` : clé aléatoire de 32 octets encodée en 64 caractères hexadécimaux, à conserver séparément et durablement pour la restauration.

`npm run backup` lit un instantané transactionnel des tables, sauvegarde les fichiers référencés et chiffre chaque élément avec AES-256-GCM après compression. Les sessions et liens d’accès ne sont pas restaurables. Le manifeste final n’est écrit qu’une fois tous les fichiers copiés ; les archives restent conservées, sans suppression automatique. Les exécutions sont visibles dans l’administration. Prévoir une politique de conservation adaptée et surveiller les exécutions GitHub en échec.

Pour vérifier en local : `npm run backup -- --local` écrit une archive sous `.data/backups/` (ignoré par Git), avec la même clé de chiffrement obligatoire.

Pour restaurer, utiliser une **nouvelle base vide**, jamais la base active : configurer `RESTORE_DATABASE_URL` et `RESTORE_AUTH_TOKEN`, conserver la clé `BACKUP_ENCRYPTION_KEY`, puis exécuter :

```sh
npm run backup:restore -- /chemin/vers/le/dossier-de-sauvegarde
# Ou, pour une archive distante dans le stockage de sauvegarde :
npm run backup:restore -- directaid-backups/IDENTIFIANT --remote
```

Pour une restauration distante, renseigner un **nouveau** stockage privé `RESTORE_BLOB_READ_WRITE_TOKEN`. En local, les fichiers sont placés dans `.data/restored-uploads`, ou dans `RESTORE_UPLOADS_DIR`. Les empreintes, le déchiffrement et les références SQL sont vérifiés. Après validation manuelle de la restauration, basculer la configuration vers la nouvelle base et le nouveau stockage. Un échec ne modifie pas la base active ; reprendre dans une destination vide. Aucun secret de restauration ne doit être commité.
