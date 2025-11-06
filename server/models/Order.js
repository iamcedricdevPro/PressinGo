const mongoose = require('mongoose');

const ItemDetailSchema = new mongoose.Schema(
	{
		label: { type: String },
		qty: { type: Number, default: 0 },
	},
	{ _id: false }
);

const OrderSchema = new mongoose.Schema(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		phone: { type: String, required: true },
		serviceType: { type: String, enum: ['lavage', 'repassage', 'lavage_repassage'], required: true },
		items: { type: mongoose.Schema.Types.Mixed, default: {} },
		withDelivery: { type: Boolean, default: false },
		address: { type: String, default: '' },
		estimatedReadyDate: { type: Date },
		total: { type: Number, required: true },
		status: { type: String, enum: ['En attente', 'En cours', 'Terminé', 'Livré'], default: 'En attente' },
	},
	{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Order', OrderSchema);


