export default function Confirmation() {
	const goHome = () => (window.location.hash = '#/');
	// Demande la permission de notifications si pas encore donnée
	if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
		Notification.requestPermission().catch(() => {});
	}
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
			<h2 className="text-2xl font-bold mb-3">Merci !</h2>
			<p className="max-w-lg text-gray-700 mb-6">
				Votre commande a été enregistrée avec succès. Un agent passera récupérer vos habits.
			</p>
			<button onClick={goHome} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Retour à l'accueil</button>
		</div>
	);
}


