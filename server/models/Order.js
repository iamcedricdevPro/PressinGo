import mongoose from 'mongoose';

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
		phone: { type: String, required: true, index: true },
		serviceType: { 
			type: String, 
			enum: ['lavage', 'repassage', 'lavage_repassage'], 
			required: true 
		},
		items: { type: mongoose.Schema.Types.Mixed, default: {} },
		withDelivery: { type: Boolean, default: false },
		address: { type: String, default: '' },
		estimatedReadyDate: { type: Date },
		total: { type: Number, required: true },
		status: { 
			type: String, 
			enum: ['En attente', 'En cours', 'Terminé', 'Livré'], 
			default: 'En attente',
			index: true
		},
	},
	{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Index pour recherches fréquentes
OrderSchema.index({ phone: 1, createdAt: -1 });
OrderSchema.index({ status: 1, estimatedReadyDate: 1 });

const Order = mongoose.model('Order', OrderSchema);

export default Order;