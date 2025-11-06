import { useEffect, useMemo, useState } from 'react';
import GarmentTable from '../components/GarmentTable.jsx';

const SERVICE_TYPES = [
	{ key: 'lavage', label: 'Lavage' },
	{ key: 'repassage', label: 'Repassage' },
	{ key: 'lavage_repassage', label: 'Lavage + Repassage' },
];

// Tarifs par défaut (seront surchargés par le serveur plus tard)
const DEFAULT_PRICING = {
	chemise: { lavage: 400, repassage: 300, lavage_repassage: 600 },
	tshirt: { lavage: 300, repassage: 200, lavage_repassage: 500 },
	pantalon: { lavage: 500, repassage: 400, lavage_repassage: 800 },
	polo: { lavage: 400, repassage: 300, lavage_repassage: 650 },
	short: { lavage: 300, repassage: 250, lavage_repassage: 500 },
	robe: { lavage: 700, repassage: 500, lavage_repassage: 1000 },
	drap: { lavage: 800, repassage: 600, lavage_repassage: 1200 },
	costume: { lavage: 1000, repassage: 800, lavage_repassage: 1500 },
	jupe: { lavage: 400, repassage: 300, lavage_repassage: 650 },
};

const DEFAULT_DELIVERY_FEE = 1000;

export default function OrderForm() {
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phone, setPhone] = useState('');
	const [serviceType, setServiceType] = useState('lavage');
	const [quantities, setQuantities] = useState({});
	const [otherLabel, setOtherLabel] = useState('');
	const [otherQty, setOtherQty] = useState(0);
	const [withDelivery, setWithDelivery] = useState(false);
	const [address, setAddress] = useState('');
	const [calc, setCalc] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const [pricing, setPricing] = useState(DEFAULT_PRICING);
	const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);

	useEffect(() => {
		fetch('/api/pricing')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data && data.pricing) setPricing(data.pricing);
				if (data && typeof data.deliveryFee === 'number') setDeliveryFee(data.deliveryFee);
			})
			.catch(() => {});
	}, []);

	const estimatedDate = useMemo(() => {
		const d = new Date();
		d.setDate(d.getDate() + 2);
		return d.toLocaleDateString();
	}, []);

	const handleCalculate = () => {
		let total = 0;
		Object.entries(quantities).forEach(([key, qty]) => {
			const priceRow = pricing[key];
			if (!priceRow) return;
			const unit = priceRow[serviceType] || 0;
			total += (qty || 0) * unit;
		});
		if (withDelivery) total += deliveryFee;
		setCalc({ total, estimatedDate, deliveryFee: withDelivery ? deliveryFee : 0 });
	};

	const handleSubmit = async () => {
		if (!calc) handleCalculate();
		setSubmitting(true);
		try {
			const body = {
				firstName,
				lastName,
				phone,
				serviceType,
				items: { ...quantities, ...(otherLabel && otherQty ? { autres: { label: otherLabel, qty: otherQty } } : {}) },
				withDelivery,
				address,
				clientTotal: calc ? calc.total : null,
			};
			await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			window.location.hash = '#/confirmation';
		} catch (e) {
			alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto p-6 animate-fadeIn">
			<h2 className="text-2xl font-bold mb-4">Faire une commande</h2>
			<div className="bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4 mb-6 animate-floatIn">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div>
					<label className="block text-sm mb-1">Nom</label>
					<input className="w-full border rounded px-3 py-2" value={lastName} onChange={(e) => setLastName(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1">Prénom</label>
					<input className="w-full border rounded px-3 py-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1">Téléphone</label>
					<input className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1">Type de service</label>
					<select className="w-full border rounded px-3 py-2" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
						{SERVICE_TYPES.map((s) => (
							<option key={s.key} value={s.key}>{s.label}</option>
						))}
					</select>
				</div>
			</div>

			</div>

			<div className="mb-6 bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4 animate-floatIn">
				<h3 className="font-semibold mb-2">Types d'habits</h3>
				<GarmentTable
					quantities={quantities}
					onChange={setQuantities}
					otherLabel={otherLabel}
					setOtherLabel={setOtherLabel}
					otherQty={otherQty}
					setOtherQty={setOtherQty}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4 animate-floatIn">
				<div>
					<label className="block text-sm mb-1">Livraison à domicile ?</label>
					<select className="w-full border rounded px-3 py-2" value={withDelivery ? 'oui' : 'non'} onChange={(e) => setWithDelivery(e.target.value === 'oui')}>
						<option value="non">Non</option>
						<option value="oui">Oui</option>
					</select>
				</div>
				<div>
					<label className="block text-sm mb-1">Adresse / Localisation</label>
					<input className="w-full border rounded px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse précise ou lien GPS" />
				</div>
			</div>

			<div className="flex items-center gap-3 mb-6 bg-white/70 backdrop-blur border rounded-lg shadow-sm p-4 animate-floatIn">
				<button onClick={handleCalculate} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black">Calculer le prix</button>
				{calc && (
					<div className="text-sm text-gray-700">
						<div>Total: <span className="font-semibold">{calc.total} XOF</span></div>
						{withDelivery && <div>Frais de livraison: {calc.deliveryFee} XOF</div>}
					</div>
				)}
			</div>

			<div className="flex gap-3">
				<button disabled={submitting} onClick={handleSubmit} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-60">
					Valider ma commande
				</button>
				<button onClick={() => (window.location.hash = '#/')} className="px-4 py-2 border rounded">Annuler</button>
			</div>
		</div>
	);
}


