import { useState } from 'react';
import { initFirebaseMessaging, getFcmToken } from '../firebase';

export default function Settings() {
	const [phone, setPhone] = useState('');
	const [status, setStatus] = useState('');

	const enablePush = async () => {
		try {
			await initFirebaseMessaging();
			if (Notification.permission === 'default') await Notification.requestPermission();
			const token = await getFcmToken(import.meta.env.VITE_FIREBASE_VAPID_KEY);
			if (!token) {
				setStatus("Impossible d'obtenir le token FCM");
				return;
			}
			await fetch('/api/fcm/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone, token }),
			});
			setStatus('Notifications activées');
		} catch {
			setStatus('Erreur lors de l’activation');
		}
	};

	const disablePush = async () => {
		try {
			const qs = new URLSearchParams(phone ? { phone } : {});
			await fetch(`/api/fcm/subscribe?${qs.toString()}`, { method: 'DELETE' });
			setStatus('Notifications désactivées');
		} catch {
			setStatus('Erreur lors de la désactivation');
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6 animate-fadeIn">
			<h2 className="text-2xl font-bold mb-4">Paramètres</h2>
			<div className="bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4 mb-6">
				<label className="block text-sm mb-1">Téléphone</label>
				<input className="w-full border rounded px-3 py-2 mb-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 0700000000" />
				<div className="flex gap-3">
					<button onClick={enablePush} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Activer les notifications</button>
					<button onClick={disablePush} className="px-4 py-2 rounded border hover:bg-gray-50 transition">Désactiver</button>
				</div>
				{status && <div className="mt-3 text-sm text-gray-700">{status}</div>}
			</div>
			<div className="bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4">
				<h3 className="font-semibold mb-2">Préférences</h3>
				<div className="text-sm text-gray-600">(À venir) SMS / WhatsApp en complément des notifications push.</div>
			</div>
		</div>
	);
}


