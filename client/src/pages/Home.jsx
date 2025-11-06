export default function Home() {
	const goToOrder = () => {
		window.location.hash = '#/order';
	};
	const goToHistory = () => {
		window.location.hash = '#/history';
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white animate-floatIn">
			<img src="/Img/logoPressinGo.png" alt="PressinGo" className="h-16 w-16 object-contain mb-3" />
			<h1 className="text-4xl font-extrabold mb-3 text-blue-700">PressinGo</h1>
			<p className="text-gray-700 mb-8 text-center max-w-xl">
				Service de blanchisserie en ligne: lavage, repassage, et livraison à domicile.
			</p>
			<div className="flex gap-3">
				<button onClick={goToOrder} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition transform hover:-translate-y-0.5 animate-pulseGlow">
				Faire une commande
				</button>
				<button onClick={goToHistory} className="px-6 py-3 border rounded-md hover:bg-gray-50">
					Historique de mes commandes
				</button>
			</div>
		</div>
	);
}


