# PressinGo

Application de blanchisserie en ligne (React + Express + MongoDB).

## Démarrage rapide (Windows cmd)

1) Backend (API Express)

- Ouvrir un terminal dans `server/`
- Installer les dépendances:

```
npm install
```

- Créer le fichier `.env` dans `server/` (copiez l'exemple ci-dessous):

```
MONGO_URL=mongodb://127.0.0.1:27017/pressingo
PORT=4000
VAPID_PUBLIC_KEY=VOTRE_CLE_PUBLIQUE
VAPID_PRIVATE_KEY=VOTRE_CLE_PRIVEE
```

- Lancer en développement (avec reload):

```
npm run dev
```

L'API sera disponible sur `http://localhost:4000`.

2) Frontend (React)

Le client utilise des requêtes relatives vers `/api`. En développement, vous pouvez soit:

- A) Servir le frontend depuis le même domaine que l'API (reverse proxy),
- B) Utiliser un serveur de dev (ex: Vite/CRA) avec un proxy de `/api` vers `http://localhost:4000`,
- C) Remplacer les appels par une baseURL absolue (ex: `http://localhost:4000/api`).

Exemple Vite (vite.config.js):

```js
export default {
	server: {
		proxy: {
			'/api': 'http://localhost:4000'
		}
	}
};
```

## Endpoints API

- GET `/api/health` → ping
- GET `/api/pricing` → tarifs et frais de livraison
- PUT `/api/pricing` → mettre à jour tarifs et frais
- GET `/api/orders` → lister commandes
- POST `/api/orders` → créer commande
- PUT `/api/orders/:id` → modifier commande (incl. statut)
- DELETE `/api/orders/:id` → supprimer commande

## Modèle Order (MongoDB)

- `firstName`, `lastName`, `phone`
- `serviceType`: `lavage` | `repassage` | `lavage_repassage`
- `items`: objet des quantités (éventuel `autres: { label, qty }`)
- `withDelivery`: booléen
- `address`: string
- `total`: number (calculé serveur)
- `status`: `En attente` | `En cours` | `Terminé` | `Livré`
- `createdAt`, `updatedAt`

## Déploiement

- Frontend (ex: Vercel); configurez le proxy `/api` vers votre backend.
- Backend (ex: Render); définissez `MONGO_URL` et `PORT` dans les variables d'environnement.

## Push Notifications (Web Push)

1) Générer des clés VAPID (une fois):

```
npx web-push generate-vapid-keys
```

2) Copier les clés dans `server/.env`:

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

3) Côté client, définissez la clé publique (Vite):

```
setx VITE_VAPID_PUBLIC_KEY "VOTRE_CLE_PUBLIQUE"
```

4) Redémarrez le client et l'API. L'utilisateur sera invité à autoriser les notifications et sera abonné aux mises à jour via la page Historique.

## Logo et icônes
## Firebase Cloud Messaging (FCM) - Notifications

1) Créez un projet Firebase → Activez Cloud Messaging.
2) Créez une App Web et récupérez la config (apiKey, projectId, etc.).
3) Dans `client/.env` (ou variables Vite), ajoutez:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...   # Clé Web Push (FCM) depuis Firebase Console
```

4) Service Worker: `client/public/firebase-messaging-sw.js` est prêt. (Optionnel: injectez les valeurs dans le SW si vous n’utilisez pas compat.)

5) Backend: placez les credentials Admin Firebase.

- Option A: Variable d’environnement pointant vers le JSON:

```
setx GOOGLE_APPLICATION_CREDENTIALS "C:\\chemin\\serviceAccount.json"
```

- Option B: Mettre le JSON inline:

```
setx FIREBASE_SERVICE_ACCOUNT_JSON "{...contenu JSON...}"
```

6) Redémarrez API et client. Dans la page `#/history`, entrez le téléphone; le navigateur demandera la permission de notifications et enregistrera le token FCM.

7) Les notifications sont envoyées à chaque création/mise à jour/suppression de commande via Firebase Admin.

- Placez votre logo dans `client/public/images/logo.png`.
- Le site affichera ce logo dans le header et comme favicon / apple-touch-icon.
- Pour la PWA, générez des icônes adaptées à partir du logo et placez-les dans `client/public/icons/`:
  - `icon-192.png` (192x192)
  - `icon-512.png` (512x512)
- Pour Android/iOS (si publication store via Capacitor): utilisez `capacitor-assets` ou un générateur pour produire les icônes et splash à partir du logo, puis ouvrez Android Studio/Xcode pour les appliquer.
