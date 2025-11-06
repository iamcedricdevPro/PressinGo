import { useEffect, useRef, useState } from 'react';
import { initFirebaseMessaging, getFcmToken, onForegroundMessage } from '../firebase';

function useSSE(phone, onEvent) {
	const ref = useRef(null);
	useEffect(() => {
		if (!phone) return;
		const url = `/api/stream?phone=${encodeURIComponent(phone)}`;
		const es = new EventSource(url);
		es.addEventListener('update', (e) => {
			try { onEvent && onEvent(JSON.parse(e.data)); } catch {}
		});
		es.onerror = () => {};
		ref.current = es;
		return () => { es.close(); };
	}, [phone]);
}

export default function History() {
	const [phone, setPhone] = useState('');
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);

	useSSE(phone, (evt) => {
		if (evt.type === 'updated') {
			setOrders((prev) => prev.map((o) => (o._id === evt.order._id ? evt.order : o)));
			if (Notification.permission === 'granted') new Notification('Mise à jour commande', { body: `Statut: ${evt.order.status}` });
		}
		if (evt.type === 'created') {
			setOrders((prev) => [evt.order, ...prev]);
		}
		if (evt.type === 'deleted') {
			setOrders((prev) => prev.filter((o) => o._id !== evt.order._id));
		}
	});

	const fetchHistory = async () => {
		if (!phone) return;
		setLoading(true);
		try {
			const r = await fetch(`/api/orders/history?phone=${encodeURIComponent(phone)}`);
			const data = await r.json();
			setOrders(data);
			if (Notification && Notification.permission === 'default') {
				try { await Notification.requestPermission(); } catch {}
			}
			// Init FCM + enregistrer token côté serveur
			await initFirebaseMessaging();
			const token = await getFcmToken(import.meta.env.VITE_FIREBASE_VAPID_KEY);
			if (token) {
				console.log('FCM token:', token);
				await fetch('/api/fcm/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phone, token }),
				});
				// Écoute en foreground
				onForegroundMessage((payload) => {
					try {
						const { title, body } = payload.notification || {};
						new Notification(title || 'Notification', { body: body || '' });
					} catch {}
				});
			} else {
				console.warn('FCM token introuvable. Vérifiez VITE_FIREBASE_VAPID_KEY et les permissions.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h2 className="text-2xl font-bold mb-4">Historique de mes commandes</h2>
			<div className="flex gap-2 mb-4">
				<input className="border rounded px-3 py-2" placeholder="Votre numéro (ex: 0700000000)" value={phone} onChange={(e) => setPhone(e.target.value)} />
				<button onClick={fetchHistory} className="px-4 py-2 bg-blue-600 text-white rounded">Rechercher</button>
				<button onClick={() => (window.location.hash = '#/')} className="px-4 py-2 border rounded">Accueil</button>
			</div>
			{loading && <div>Chargement...</div>}
			{orders.length > 0 && (
				<div className="overflow-x-auto border rounded">
					<table className="min-w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="text-left px-4 py-3">Date</th>
								<th className="text-left px-4 py-3">Service</th>
								<th className="text-left px-4 py-3">Total</th>
								<th className="text-left px-4 py-3">Statut</th>
								<th className="text-left px-4 py-3">Récupération</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o._id} className="odd:bg-white even:bg-gray-50">
									<td className="px-4 py-3">{new Date(o.createdAt).toLocaleString()}</td>
									<td className="px-4 py-3">{o.serviceType}</td>
									<td className="px-4 py-3">{o.total} XOF</td>
									<td className="px-4 py-3">{o.status}</td>
									<td className="px-4 py-3">{o.estimatedReadyDate ? new Date(o.estimatedReadyDate).toLocaleDateString() : '-'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}


