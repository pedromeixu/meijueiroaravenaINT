import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Solicitud from "../modelos/Solicitud.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

const router = express.Router();

router.post("/", upload.single("foto"), async (req, res) => {
  try {
    const body = req.body;

    if (!body.nombre || !body.apellidos || !body.email) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const nueva = {
      nombre: body.nombre,
      apellidos: body.apellidos,
      email: body.email,
      telefono: body.telefono || "",
      direccion: body.direccion || "",
      provincia: body.provincia || "",
      municipio: body.municipio || "",
    };

    if (req.file) {
      nueva.foto = `/uploads/${req.file.filename}`;
    }

    const doc = new Solicitud(nueva);
    const saved = await doc.save();
    const out = saved.toObject();
    out.id = out._id;
    res.json(out);
  } catch (err) {
    console.error("Error creando solicitud:", err);
    res.status(500).json({ error: "Error interno al crear solicitud" });
  }
});

// Obtener todas las solicitudes
router.get("/", async (req, res) => {
  try {
    const lista = await Solicitud.find().sort({ fechaCreacion: -1 });
    const mapped = lista.map((d) => {
      const o = d.toObject();
      o.id = o._id;
      o.fechaSolicitud = o.fechaSolicitud || o.fechaCreacion || o.fecha || null;
      return o;
    });
    res.json(mapped);
  } catch (err) {
    console.error("Error obteniendo solicitudes:", err);
    res.status(500).json({ error: "Error interno al obtener solicitudes" });
  }
});

// Eliminar solicitud
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Solicitud.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ error: "Solicitud no encontrada" });

    // intentar borrar archivo si existe
    if (eliminado.foto) {
      const ruta = path.join(__dirname, "uploads", path.basename(eliminado.foto));
      try {
        if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
      } catch (e) {
        console.error("No se pudo borrar foto de solicitud:", e.message);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando solicitud:", err);
    res.status(500).json({ error: "Error interno al eliminar solicitud" });
  }
});

export default router;
