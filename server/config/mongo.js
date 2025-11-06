const mongoose = require('mongoose');

async function connectMongo() {
	const uri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pressingo';
	mongoose.set('strictQuery', true);
	await mongoose.connect(uri, { autoIndex: true });
	return mongoose.connection;
}

module.exports = { connectMongo };


