/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Cette config sera injectée depuis build si besoin, sinon mettez vos valeurs ici.
firebase.initializeApp({
	apiKey: "AIzaSyCsGvzmM8FuUv3C-k8hxSfnVgLpLol8iv0",
	authDomain: "pressingo-d1af6.firebaseapp.com",
	projectId: "pressingo-d1af6",
	storageBucket: "pressingo-d1af6.firebasestorage.app",
	messagingSenderId: "506942479773",
	appId: "1:506942479773:web:1b2b67306ffe584b8aa374",
	measurementId: "G-EET43WPH3H"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
	self.registration.showNotification(payload.notification?.title || 'Notification', {
		body: payload.notification?.body || '',
		icon: '/images/logo.png',
		data: payload.data || {},
	});
});


