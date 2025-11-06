import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// REMPLACEZ par votre config Firebase Web App
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging = null;
let app = null;

export async function initFirebaseMessaging() {
	const supported = await isSupported().catch(() => false);
	if (!supported) return null;
	if (!app) app = initializeApp(firebaseConfig);
	messaging = getMessaging(app);
	return messaging;
}

export async function getFcmToken(vapidKey) {
	if (!messaging) return null;
	try {
		const token = await getToken(messaging, { vapidKey });
		return token || null;
	} catch {
		return null;
	}
}

export function onForegroundMessage(cb) {
	if (!messaging) return () => {};
	return onMessage(messaging, cb);
}


