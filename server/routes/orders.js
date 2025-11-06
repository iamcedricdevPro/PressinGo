import express from "express";
import Order from "../models/Order.js";
import Subscription from "../models/Subscription.js";
import webpush from "web-push";
import { initFirebaseAdmin } from "../config/firebase.js";
import FcmToken from "../models/FcmToken.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

function computeTotal(items, serviceType, pricing, deliveryFee, withDelivery) {
	let total = 0;
	for (const [key, value] of Object.entries(items || {})) {
		if (key === "autres") {
			const v = value && typeof value === "object" ? value.qty || 0 : 0;
			total += 0 * v;
			continue;
		}
		const qty = typeof value === "number" ? value : 0;
		const row = pricing[key];
		if (!row) continue;
		const unit = row[serviceType] || 0;
		total += qty * unit;
	}
	if (withDelivery) total += deliveryFee;
	return total;
}

export default (state, { requireAdmin } = {}) => {
	const router = express.Router();

	// GET all orders
	router.get("/", requireAdmin, async (req, res) => {
		const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
		res.json(orders);
	});

	// POST create order
	router.post("/", async (req, res) => {
		const { firstName, lastName, phone, serviceType, items, withDelivery, address, estimatedReadyDate } = req.body || {};
		if (!firstName || !lastName || !phone || !serviceType)
			return res.status(400).json({ error: "Champs requis manquants" });

		const total = computeTotal(items, serviceType, state.pricing, state.deliveryFee, !!withDelivery);

		const order = await Order.create({
			firstName,
			lastName,
			phone,
			serviceType,
			items: items || {},
			withDelivery: !!withDelivery,
			address: address || "",
			estimatedReadyDate: estimatedReadyDate ? new Date(estimatedReadyDate) : undefined,
			total,
		});

		res.status(201).json(order);

		// Notify clients
		const set = state.clientsByPhone.get(order.phone);
		if (set)
			for (const client of set)
				client.write(`event: update\ndata: ${JSON.stringify({ type: "created", order })}\n\n`);

		// Web Push
		try {
			const subs = await Subscription.find({ phone: order.phone }).lean();
			await Promise.all(
				subs.map((s) =>
					webpush
						.sendNotification(
							s.subscription,
							JSON.stringify({
								title: "Commande bien reçue",
								body: `Merci ${order.firstName}!`,
								data: { id: order._id },
							})
						)
						.catch(() => null)
				)
			);
		} catch {}

		// FCM Push
		try {
			const admin = initFirebaseAdmin();
			const tokens = await FcmToken.find({ phone: order.phone }).lean();
			if (tokens.length) {
				await admin.messaging().sendEachForMulticast({
					tokens: tokens.map((t) => t.token),
					notification: {
						title: "Commande bien reçue",
						body: `Merci ${order.firstName}!`,
					},
					data: { id: String(order._id) },
				});
			}
		} catch {}
	});

	// PUT update order
	router.put("/:id", requireAdmin, async (req, res) => {
		const id = req.params.id;
		const update = { ...req.body };
		if (update.items || update.serviceType || typeof update.withDelivery === "boolean") {
			const current = await Order.findById(id);
			if (!current) return res.status(404).json({ error: "Not found" });
			const items = update.items || current.items;
			const serviceType = update.serviceType || current.serviceType;
			const withDelivery =
				typeof update.withDelivery === "boolean" ? update.withDelivery : current.withDelivery;
			update.total = computeTotal(items, serviceType, state.pricing, state.deliveryFee, withDelivery);
		}
		const saved = await Order.findByIdAndUpdate(id, update, { new: true });
		if (!saved) return res.status(404).json({ error: "Not found" });
		res.json(saved);

		const set = state.clientsByPhone.get(saved.phone);
		if (set)
			for (const client of set)
				client.write(`event: update\ndata: ${JSON.stringify({ type: "updated", order: saved })}\n\n`);

		try {
			const subs = await Subscription.find({ phone: saved.phone }).lean();
			const msg = `Commande ${saved.status.toLowerCase()}`;
			await Promise.all(
				subs.map((s) =>
					webpush
						.sendNotification(
							s.subscription,
							JSON.stringify({
								title: "Mise à jour de commande",
								body: msg,
								data: { id: saved._id },
							})
						)
						.catch(() => null)
				)
			);
		} catch {}

		try {
			const admin = initFirebaseAdmin();
			const tokens = await FcmToken.find({ phone: saved.phone }).lean();
			if (tokens.length) {
				await admin.messaging().sendEachForMulticast({
					tokens: tokens.map((t) => t.token),
					notification: {
						title: "Mise à jour de commande",
						body: `Statut: ${saved.status}`,
					},
					data: { id: String(saved._id) },
				});
			}
		} catch {}
	});

	// DELETE order
	router.delete("/:id", requireAdmin, async (req, res) => {
		const id = req.params.id;
		const deleted = await Order.findByIdAndDelete(id);
		res.json({ ok: true });
		if (deleted) {
			const set = state.clientsByPhone.get(deleted.phone);
			if (set)
				for (const client of set)
					client.write(`event: update\ndata: ${JSON.stringify({ type: "deleted", order: deleted })}\n\n`);

			try {
				const subs = await Subscription.find({ phone: deleted.phone }).lean();
				await Promise.all(
					subs.map((s) =>
						webpush
							.sendNotification(
								s.subscription,
								JSON.stringify({
									title: "Commande supprimée",
									body: "Votre commande a été supprimée.",
									data: { id: deleted._id },
								})
							)
							.catch(() => null)
					)
				);
			} catch {}

			try {
				const admin = initFirebaseAdmin();
				const tokens = await FcmToken.find({ phone: deleted.phone }).lean();
				if (tokens.length) {
					await admin.messaging().sendEachForMulticast({
						tokens: tokens.map((t) => t.token),
						notification: {
							title: "Commande supprimée",
							body: "Votre commande a été supprimée.",
						},
						data: { id: String(deleted._id) },
					});
				}
			} catch {}
		}
	});

	// History
	router.get("/history", async (req, res) => {
		const phone = (req.query.phone || "").trim();
		if (!phone) return res.status(400).json({ error: "phone requis" });
		const orders = await Order.find({ phone }).sort({ createdAt: -1 }).lean();
		res.json(orders);
	});

	// Ticket PDF
	router.get("/:id/ticket", async (req, res) => {
		const id = req.params.id;
		const order = await Order.findById(id).lean();
		if (!order) return res.status(404).send("Not found");

		const ticketNo = String(order._id).slice(-6).toUpperCase();
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `inline; filename="ticket_${ticketNo}.pdf"`);

		const doc = new PDFDocument({ size: "A5", margin: 28 });
		doc.pipe(res);
		doc.fontSize(18).text("PressinGo - Ticket", { align: "center" });
		doc.moveDown(0.5);
		doc.fontSize(12).text(`Ticket #: ${ticketNo}`);
		doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
		doc.text(`Client: ${order.lastName} ${order.firstName}`);
		doc.text(`Téléphone: ${order.phone}`);
		doc.text(`Service: ${order.serviceType}`);
		doc.text(`Livraison: ${order.withDelivery ? "Oui" : "Non"}`);
		doc.text(`Adresse: ${order.address || "-"}`);
		doc.moveDown(0.5);
		doc.fontSize(13).text("Détails:", { underline: true });

		Object.entries(order.items || {}).forEach(([k, v]) => {
			if (k === "autres" && v && typeof v === "object") {
				doc.fontSize(12).text(`- ${v.label || "Autres"}: ${v.qty || 0}`);
			} else {
				doc.fontSize(12).text(`- ${k}: ${v}`);
			}
		});

		doc.moveDown(0.5);
		doc.fontSize(14).text(`Total: ${order.total} XOF`, { align: "right" });
		doc.moveDown(0.5);

		try {
			const qrPayload = JSON.stringify({ id: String(order._id), phone: order.phone });
			const qrDataUrl = await QRCode.toDataURL(qrPayload);
			const base64 = qrDataUrl.split(",")[1];
			const buffer = Buffer.from(base64, "base64");
			doc.image(buffer, doc.page.width - 120, 40, { fit: [80, 80] });
		} catch {}

		doc.end();
	});

	return router;
};
