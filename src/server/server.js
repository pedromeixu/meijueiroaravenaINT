import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Stripe from "stripe";

import authRoutes from "./authRoutes.js";
import contactoRoutes from "./contactos.js";
import articulosRoutes from "./articulosRoutes.js";
import reservasRoutes from "./reservasRoutes.js";
import facturasRoutes from "./facturasRoutes.js";
import { soloAdmin, verificarToken } from "./authController.js";
import solicitudesRoutes from "./solicitudes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS — SOLO UNA VEZ Y ANTES DE TODO
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
}));

app.use(express.json());

// ✅ Servir imágenes con CORS habilitado
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/api/facturas", verificarToken, facturasRoutes);
app.use("/api/articulos", articulosRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/reservas", reservasRoutes);

// Checkout Stripe
app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items } = req.body;

        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'eur',
                product_data: { name: item.nombre },
                unit_amount: Math.round(item.precio * 100),
            },
            quantity: item.cantidad,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:5173/success',
            cancel_url: 'http://localhost:5173/cancel',
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB:", err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
