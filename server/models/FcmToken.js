const mongoose = require('mongoose');

const FcmTokenSchema = new mongoose.Schema(
	{
		phone: { type: String, index: true, required: true },
		token: { type: String, required: true, unique: true },
		lastSeenAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('FcmToken', FcmTokenSchema);


