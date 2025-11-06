const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
	{
		phone: { type: String, index: true, required: true },
		subscription: { type: Object, required: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);


