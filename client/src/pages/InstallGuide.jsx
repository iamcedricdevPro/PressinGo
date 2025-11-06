import { useEffect, useState } from 'react';

export default function InstallGuide() {
	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [supported, setSupported] = useState(false);

	useEffect(() => {
		const handler = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setSupported(true);
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	}, []);

	const install = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		await deferredPrompt.userChoice;
		setDeferredPrompt(null);
	};

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-6 animate-fadeIn">
			<h2 className="text-2xl font-bold">Installer l'app PressinGo</h2>
			<div className="bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4">
				<h3 className="font-semibold mb-2">Android (Chrome)</h3>
				<ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">
					<li>Ouvrez le site dans Chrome.</li>
					<li>Menu ⋮ → « Ajouter à l'écran d'accueil ».</li>
					<li>Confirmez l'installation.</li>
				</ol>
				{supported && (
					<button onClick={install} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Installer maintenant</button>
				)}
			</div>
			<div className="bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4">
				<h3 className="font-semibold mb-2">iPhone (Safari, iOS 16.4+)</h3>
				<ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">
					<li>Ouvrez le site dans Safari.</li>
					<li>Tapez sur l'icône Partager.</li>
					<li>Choisissez « Sur l'écran d'accueil ».</li>
					<li>Ouvrez l'app depuis l'icône installée pour activer les notifications.</li>
				</ol>
			</div>
			<div className="bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4">
				<h3 className="font-semibold mb-2">Notifications</h3>
				<p className="text-sm text-gray-700">Acceptez les notifications lors de la première ouverture (page Historique ou Paramètres) pour recevoir les mises à jour de statut.</p>
			</div>
		</div>
	);
}


