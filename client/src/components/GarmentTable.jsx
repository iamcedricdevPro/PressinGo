const DEFAULT_GARMENTS = [
	{ key: 'chemise', label: 'Chemise' },
	{ key: 'tshirt', label: 'T-shirt' },
	{ key: 'pantalon', label: 'Pantalon' },
	{ key: 'polo', label: 'Polo' },
	{ key: 'short', label: 'Short' },
	{ key: 'robe', label: 'Robe' },
	{ key: 'drap', label: 'Drap' },
	{ key: 'costume', label: 'Costume' },
	{ key: 'jupe', label: 'Jupe' },
];

export default function GarmentTable({ quantities, onChange, otherLabel, setOtherLabel, otherQty, setOtherQty }) {
	const updateQty = (key, value) => {
		const n = Math.max(0, parseInt(value || '0', 10) || 0);
		onChange({ ...quantities, [key]: n });
	};

	return (
		<div className="w-full overflow-x-auto">
			<table className="min-w-full border border-gray-200 rounded-md">
				<thead className="bg-gray-50">
					<tr>
						<th className="text-left p-3 border-b">Type d'habit</th>
						<th className="text-left p-3 border-b">Quantité</th>
					</tr>
				</thead>
				<tbody>
					{DEFAULT_GARMENTS.map((g) => (
						<tr key={g.key} className="odd:bg-white even:bg-gray-50">
							<td className="p-3 border-b">{g.label}</td>
							<td className="p-3 border-b">
								<input
									type="number"
									min="0"
									className="w-24 border rounded px-2 py-1"
									value={quantities[g.key] ?? 0}
									onChange={(e) => updateQty(g.key, e.target.value)}
								/>
							</td>
						</tr>
					))}
					<tr className="bg-white">
						<td className="p-3 border-b">
							<div className="flex items-center gap-2">
								<span>Autres:</span>
								<input
									type="text"
									placeholder="ex: Couverture"
									className="flex-1 border rounded px-2 py-1"
									value={otherLabel}
									onChange={(e) => setOtherLabel(e.target.value)}
								/>
							</div>
						</td>
						<td className="p-3 border-b">
							<input
								type="number"
								min="0"
								className="w-24 border rounded px-2 py-1"
								value={otherQty}
								onChange={(e) => setOtherQty(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
							/>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}


