import { useState } from 'react';

// Router minimaliste sans dépendances, basé sur l'ancre de l'URL
function useHashRoute() {
	const [hash, setHash] = useState(() => window.location.hash || '#/');

	useState(() => {
		const onHashChange = () => setHash(window.location.hash || '#/');
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	});

	return hash.replace(/^#/, '') || '/';
}

import Home from './pages/Home.jsx';
import OrderForm from './pages/OrderForm.jsx';
import Confirmation from './pages/Confirmation.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import InstallGuide from './pages/InstallGuide.jsx';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
	const route = useHashRoute();

	return (
		<ToastProvider>
		<div className="min-h-screen flex flex-col">
			<header className="border-b">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<div className="flex items-center gap-2 font-bold">
						<img src="/Img/logoPressinGo.png" alt="PressinGo" className="h-8 w-8 object-contain" />
						<span>PressinGo</span>
					</div>
					<nav className="flex gap-3 text-sm">
						<button onClick={() => (window.location.hash = '#/')} className="px-3 py-1 rounded hover:bg-gray-50">Accueil</button>
						<button onClick={() => (window.location.hash = '#/order')} className="px-3 py-1 rounded hover:bg-gray-50 transition">Commander</button>
						<button onClick={() => (window.location.hash = '#/history')} className="px-3 py-1 rounded hover:bg-gray-50 transition">Historique</button>
						<button onClick={() => (window.location.hash = '#/settings')} className="px-3 py-1 rounded hover:bg-gray-50 transition">Paramètres</button>
						<button onClick={() => (window.location.hash = '#/install')} className="px-3 py-1 rounded hover:bg-gray-50 transition">Installer l'app</button>
					</nav>
				</div>
			</header>
			<main className="flex-1">
				{route.startsWith('/admin') ? <AdminDashboard />
					: route.startsWith('/order') ? <OrderForm />
					: route.startsWith('/confirmation') ? <Confirmation />
					: route.startsWith('/history') ? <History />
					: route.startsWith('/settings') ? <Settings />
					: route.startsWith('/install') ? <InstallGuide />
					: <Home />}
			</main>
			<footer className="border-t text-center text-sm text-gray-600 py-4">© {new Date().getFullYear()} PressinGo</footer>
		</div>
		</ToastProvider>
	);
}


