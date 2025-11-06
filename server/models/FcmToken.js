import mongoose from 'mongoose';

const FcmTokenSchema = new mongoose.Schema(
	{
		phone: { type: String, index: true, required: true },
		token: { type: String, required: true, unique: true },
		lastSeenAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

const FcmToken = mongoose.model('FcmToken', FcmTokenSchema);

export default FcmToken;