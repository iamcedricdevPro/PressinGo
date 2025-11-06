import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
	{
		phone: { type: String, index: true, required: true },
		subscription: { type: Object, required: true },
	},
	{ timestamps: true }
);

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;

