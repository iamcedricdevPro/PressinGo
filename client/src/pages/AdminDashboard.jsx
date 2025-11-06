import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/Toast.jsx';

const STATUS = ['En attente', 'En cours', 'Terminé', 'Livré'];

export default function AdminDashboard() {
    const toast = useToast();
	const [authed, setAuthed] = useState(false);
	const [token, setToken] = useState('');
	const [orders, setOrders] = useState([]);
	const [q, setQ] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [pricing, setPricing] = useState(null);
	const [deliveryFee, setDeliveryFee] = useState(1000);
	const [savingPricing, setSavingPricing] = useState(false);

	useEffect(() => {
		const saved = sessionStorage.getItem('admin_token');
		if (saved) { setToken(saved); setAuthed(true); }
	}, []);

	useEffect(() => {
		if (!authed) return;
		fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
			.then((r) => r.json())
			.then(setOrders)
			.catch(() => {});

		fetch('/api/pricing')
			.then((r) => r.json())
			.then((data) => {
				setPricing(data.pricing);
				if (typeof data.deliveryFee === 'number') setDeliveryFee(data.deliveryFee);
			})
			.catch(() => {});
	}, [authed, token]);

	const filtered = useMemo(() => {
		return orders.filter((o) => {
			const matchQ = q
				? `${o.firstName} ${o.lastName} ${o.phone} ${o.address}`.toLowerCase().includes(q.toLowerCase())
				: true;
			const matchStatus = statusFilter ? o.status === statusFilter : true;
			return matchQ && matchStatus;
		});
	}, [orders, q, statusFilter]);

	const exportCSV = () => {
		const headers = ['Nom', 'Prénom', 'Téléphone', 'Service', 'Total', 'Adresse', 'Livraison', 'Statut', 'Date'];
		const rows = filtered.map((o) => [
			o.lastName,
			o.firstName,
			o.phone,
			o.serviceType,
			o.total,
			o.address,
			o.withDelivery ? 'Oui' : 'Non',
			o.status,
			new Date(o.createdAt).toLocaleString(),
		]);
		const content = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
		const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'orders.csv';
		a.click();
		URL.revokeObjectURL(url);
	};

	const updateStatus = async (id, status) => {
        await fetch(`/api/orders/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ status }),
		});
		setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
        toast?.success('Statut mis à jour');
	};

	const removeOrder = async (id) => {
		if (!confirm('Supprimer cette commande ?')) return;
        await fetch(`/api/orders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
		setOrders((prev) => prev.filter((o) => o._id !== id));
        toast?.success('Commande supprimée');
	};

	const updateEstimatedDate = async (id, dateStr) => {
		await fetch(`/api/orders/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ estimatedReadyDate: dateStr ? new Date(dateStr).toISOString() : null }),
		});
		setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, estimatedReadyDate: dateStr ? new Date(dateStr).toISOString() : null } : o)));
	};

	const setPriceValue = (garmentKey, field, value) => {
		const n = Math.max(0, parseInt(value || '0', 10) || 0);
		setPricing((prev) => ({
			...prev,
			[garmentKey]: {
				...prev[garmentKey],
				[field]: n,
			},
		}));
	};

	const addNewGarment = () => {
		const key = prompt("Clé du nouvel habit (ex: couverture)");
		if (!key) return;
		setPricing((prev) => ({
			...prev,
			[key]: { lavage: 0, repassage: 0, lavage_repassage: 0 },
		}));
	};

	const removeGarment = (key) => {
		if (!confirm(`Supprimer le type d'habit "${key}" ?`)) return;
		setPricing((prev) => {
			const copy = { ...prev };
			delete copy[key];
			return copy;
		});
	};

	const savePricing = async () => {
		setSavingPricing(true);
		try {
        await fetch('/api/pricing', {
				method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ pricing, deliveryFee }),
			});
            toast?.success('Tarifs mis à jour');
		} catch (e) {
            toast?.error('Erreur de sauvegarde des tarifs');
		} finally {
			setSavingPricing(false);
		}
	};

	if (!authed) {
		let pwd = '';
		const doLogin = async () => {
			if (!pwd) return;
			const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) });
            if (res.ok) {
				const data = await res.json();
				sessionStorage.setItem('admin_token', data.token);
				setToken(data.token);
				setAuthed(true);
                toast?.success('Connexion réussie');
			} else {
                toast?.error('Mot de passe invalide');
			}
		};
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="border rounded p-6 w-80 animate-fadeIn">
					<h3 className="font-semibold mb-3">Connexion admin</h3>
					<input type="password" className="w-full border rounded px-3 py-2 mb-3" placeholder="Mot de passe" onChange={(e) => (pwd = e.target.value)} />
					<button onClick={doLogin} className="bg-gray-900 text-white px-6 py-2 rounded w-full">Se connecter</button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<h2 className="text-2xl font-bold mb-4">Tableau de bord - Commandes</h2>

			{/* Section Tarifs */}
			<div className="mb-8 border rounded p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold">Tarifs et livraison</h3>
					<div className="flex items-center gap-2">
						<button onClick={addNewGarment} className="px-3 py-1 border rounded">Ajouter un type</button>
						<button disabled={savingPricing} onClick={savePricing} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60">{savingPricing ? 'Sauvegarde...' : 'Sauvegarder'}</button>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-3">
					<div className="md:col-span-3 text-sm text-gray-600">Modifiez les prix unitaires par type et service. Les nouvelles commandes utiliseront ces tarifs.</div>
					<div>
						<label className="block text-sm mb-1">Frais de livraison</label>
						<input type="number" min="0" className="w-full border rounded px-2 py-1" value={deliveryFee} onChange={(e) => setDeliveryFee(Math.max(0, parseInt(e.target.value || '0', 10) || 0))} />
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="text-left p-2">Type</th>
								<th className="text-left p-2">Lavage</th>
								<th className="text-left p-2">Repassage</th>
								<th className="text-left p-2">Lavage + Repassage</th>
								<th className="text-left p-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{pricing && Object.keys(pricing).map((key) => (
								<tr key={key} className="odd:bg-white even:bg-gray-50">
									<td className="p-2 capitalize">{key}</td>
									<td className="p-2"><input type="number" min="0" className="w-28 border rounded px-2 py-1" value={pricing[key].lavage ?? 0} onChange={(e) => setPriceValue(key, 'lavage', e.target.value)} /></td>
									<td className="p-2"><input type="number" min="0" className="w-28 border rounded px-2 py-1" value={pricing[key].repassage ?? 0} onChange={(e) => setPriceValue(key, 'repassage', e.target.value)} /></td>
									<td className="p-2"><input type="number" min="0" className="w-28 border rounded px-2 py-1" value={pricing[key].lavage_repassage ?? 0} onChange={(e) => setPriceValue(key, 'lavage_repassage', e.target.value)} /></td>
									<td className="p-2"><button onClick={() => removeGarment(key)} className="text-red-600 hover:underline">Retirer</button></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
				<input className="border rounded px-3 py-2" placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} />
				<select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
					<option value="">Tous statuts</option>
					{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
				</select>
				<button onClick={exportCSV} className="border px-3 py-2 rounded">Exporter CSV</button>
                <button onClick={() => { sessionStorage.removeItem('admin_token'); setAuthed(false); setToken(''); toast?.info('Déconnecté'); }} className="px-3 py-2 rounded border hover:bg-gray-50">Déconnexion</button>
			</div>

            <div className="overflow-x-auto border rounded">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
						<tr>
                            <th className="text-left px-4 py-3">Client</th>
                            <th className="text-left px-4 py-3">Téléphone</th>
                            <th className="text-left px-4 py-3">Service</th>
                            <th className="text-left px-4 py-3">Détails</th>
                            <th className="text-left px-4 py-3">Total</th>
                            <th className="text-left px-4 py-3">Adresse</th>
                            <th className="text-left px-4 py-3">Livraison</th>
                            <th className="text-left px-4 py-3">Statut</th>
                                <th className="text-left px-4 py-3">Récupération</th>
                                <th className="text-left px-4 py-3">Date</th>
                            <th className="text-left px-4 py-3">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((o, idx) => (
                            <tr key={o._id} className="odd:bg-white even:bg-gray-50 animate-fadeIn" style={{ animationDelay: `${Math.min(idx * 50, 600)}ms` }}>
                                <td className="px-4 py-3">{o.lastName} {o.firstName}</td>
                                <td className="px-4 py-3">{o.phone}</td>
                                <td className="px-4 py-3">{o.serviceType}</td>
                                <td className="px-4 py-3 text-base max-w-lg">
                                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(o.items, null, 2)}</pre>
								</td>
                                <td className="px-4 py-3">{o.total} XOF</td>
                                <td className="px-4 py-3">{o.address}</td>
                                <td className="px-4 py-3">{o.withDelivery ? 'Oui' : 'Non'}</td>
                                <td className="px-4 py-3">
									<select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} className="border rounded px-2 py-1">
										{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
									</select>
								</td>
                                <td className="px-4 py-3">
									<input type="date" className="border rounded px-2 py-1" value={o.estimatedReadyDate ? new Date(o.estimatedReadyDate).toISOString().slice(0,10) : ''} onChange={(e) => updateEstimatedDate(o._id, e.target.value)} />
								</td>
                                <td className="px-4 py-3">{new Date(o.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-3 space-x-3">
                                    <a href={`/api/orders/${o._id}/ticket`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ticket PDF</a>
                                    <button onClick={() => removeOrder(o._id)} className="text-red-600 hover:underline">Supprimer</button>
                                </td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}


