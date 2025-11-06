const admin = require('firebase-admin');

function initFirebaseAdmin() {
	if (admin.apps.length) return admin.app();
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		// admin will auto load the JSON file via env path
		admin.initializeApp();
		return admin.app();
	}
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
		admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
		return admin.app();
	}
	throw new Error('Firebase Admin creds manquantes: définissez GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_SERVICE_ACCOUNT_JSON');
}

module.exports = { initFirebaseAdmin };


