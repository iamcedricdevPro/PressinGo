require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./config/mongo');
const webpush = require('web-push');
const Subscription = require('./models/Subscription');
const { initFirebaseAdmin } = require('./config/firebase');
const FcmToken = require('./models/FcmToken');
const jwt = require('jsonwebtoken');

// Tarifs par défaut (modifiable via endpoint /api/pricing)
const defaultPricing = {
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

const state = {
	pricing: defaultPricing,
	deliveryFee: 1000,
	clientsByPhone: new Map(), // phone => Set(res)
};

async function main() {
	await connectMongo();
	const app = express();

	app.use(cors());
	app.use(express.json());

	app.get('/api/health', (req, res) => res.json({ ok: true }));

	// Admin auth
	function requireAdmin(req, res, next) {
		const auth = req.headers.authorization || '';
		const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
		if (!token) return res.status(401).json({ error: 'unauthorized' });
		try {
			const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'dev-secret');
			if (payload && payload.role === 'admin') return next();
			return res.status(401).json({ error: 'unauthorized' });
		} catch {
			return res.status(401).json({ error: 'unauthorized' });
		}
	}

	app.post('/api/admin/login', (req, res) => {
		const { password } = req.body || {};
		const expected = process.env.ADMIN_PASSWORD || 'admin';
		if (password && password === expected) {
			const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET || 'dev-secret', { expiresIn: '12h' });
			return res.json({ token });
		}
		return res.status(401).json({ error: 'invalid_credentials' });
	});

	// Web Push setup
	if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
		webpush.setVapidDetails('mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
	}

	app.post('/api/push/subscribe', async (req, res) => {
		const { phone, subscription } = req.body || {};
		if (!phone || !subscription) return res.status(400).json({ error: 'phone et subscription requis' });
		await Subscription.findOneAndUpdate({ phone, 'subscription.endpoint': subscription.endpoint }, { phone, subscription }, { upsert: true });
		res.json({ ok: true, publicKey: process.env.VAPID_PUBLIC_KEY || null });
	});

	// FCM subscribe
	app.post('/api/fcm/subscribe', async (req, res) => {
		try {
			const { phone, token } = req.body || {};
			if (!phone || !token) return res.status(400).json({ error: 'phone et token requis' });
			await FcmToken.findOneAndUpdate({ token }, { phone, token, lastSeenAt: new Date() }, { upsert: true });
			res.json({ ok: true });
		} catch (e) {
			res.status(500).json({ error: 'subscribe failed' });
		}
	});

	// FCM unsubscribe
	app.delete('/api/fcm/subscribe', async (req, res) => {
		try {
			const { phone, token } = req.query;
			if (!token && !phone) return res.status(400).json({ error: 'token ou phone requis' });
			if (token) await FcmToken.deleteOne({ token });
			if (phone) await FcmToken.deleteMany({ phone });
			res.json({ ok: true });
		} catch {
			res.status(500).json({ error: 'unsubscribe failed' });
		}
	});

	// FCM diagnostics
	app.get('/api/fcm/diag', async (req, res) => {
		const phone = (req.query.phone || '').trim();
		let adminOk = true;
		try { initFirebaseAdmin(); } catch { adminOk = false; }
		const count = phone ? await FcmToken.countDocuments({ phone }) : await FcmToken.estimatedDocumentCount();
		res.json({ adminOk, tokenCount: count });
	});

	// Pricing endpoints
	app.get('/api/pricing', (req, res) => {
		res.json({ pricing: state.pricing, deliveryFee: state.deliveryFee });
	});
	app.put('/api/pricing', requireAdmin, (req, res) => {
		const { pricing, deliveryFee } = req.body || {};
		if (pricing && typeof pricing === 'object') state.pricing = pricing;
		if (typeof deliveryFee === 'number') state.deliveryFee = deliveryFee;
		res.json({ pricing: state.pricing, deliveryFee: state.deliveryFee });
	});

	// Orders routes
	const ordersRouter = require('./routes/orders')(state, { requireAdmin });
	app.use('/api/orders', ordersRouter);

	// SSE stream for notifications
	app.get('/api/stream', (req, res) => {
		const phone = (req.query.phone || '').trim();
		if (!phone) return res.status(400).end();
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.flushHeaders();
		res.write(`event: ping\n`);
		res.write(`data: ok\n\n`);
		let set = state.clientsByPhone.get(phone);
		if (!set) {
			set = new Set();
			state.clientsByPhone.set(phone, set);
		}
		set.add(res);
		req.on('close', () => {
			set.delete(res);
			if (set.size === 0) state.clientsByPhone.delete(phone);
		});
	});

	const port = process.env.PORT || 4000;
	app.listen(port, () => console.log(`API PressinGo on :${port}`));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});


