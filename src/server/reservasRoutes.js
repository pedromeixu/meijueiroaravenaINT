import express from "express";
import Reserva from "../modelos/Reserva.js";
import Articulo from "../modelos/Articulo.js";

const router = express.Router();

// Crear reserva y marcar artículo como reservado
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    console.log("POST /api/reservas body:", data);

    if (!data.usuarioId || !data.vehiculoId) {
      return res.status(400).json({ error: "Faltan campos obligatorios", received: data });
    }

    const reserva = new Reserva(data);
    const guardada = await reserva.save();

    // Intentar marcar el artículo como reservado (no fatal si falla)
    try {
      await Articulo.findByIdAndUpdate(data.vehiculoId, { estado: "reservado" });
    } catch (err) {
      console.error("No se pudo actualizar estado del artículo:", err.message);
    }

    const salida = guardada.toObject();
    salida.id = salida._id;
    res.json(salida);
  } catch (error) {
    console.error("Error creando reserva:", error);
    res.status(500).json({ error: "Error interno al crear reserva" });
  }
});

// Obtener reservas. Si se pasa usuarioId y esAdmin=false devuelve solo del usuario
router.get("/", async (req, res) => {
  try {
    const { usuarioId, esAdmin } = req.query;
    if (usuarioId && (esAdmin === "false" || esAdmin === false)) {
      const lista = await Reserva.find({ usuarioId }).sort({ fechaCreacion: -1 });
      const mapped = lista.map((d) => {
        const o = d.toObject();
        o.id = o._id;
        return o;
      });
      return res.json(mapped);
    }

    const lista = await Reserva.find().sort({ fechaCreacion: -1 });
    const mappedAll = lista.map((d) => {
      const o = d.toObject();
      o.id = o._id;
      return o;
    });
    res.json(mappedAll);
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    res.status(500).json({ error: "Error interno al obtener reservas" });
  }
});

// Actualizar estado de reserva
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: "Falta estado" });

    const actualizado = await Reserva.findByIdAndUpdate(id, { estado }, { new: true });
    if (!actualizado) return res.status(404).json({ error: "Reserva no encontrada" });
    const salida = actualizado.toObject();
    salida.id = salida._id;

    // Si se cancela, intentar liberar el artículo
    if (estado === "cancelada") {
      try {
        await Articulo.findByIdAndUpdate(actualizado.vehiculoId, { estado: "disponible" });
      } catch (err) {
        console.error("No se pudo actualizar artículo al cancelar:", err.message);
      }
    }

    res.json(salida);
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    res.status(500).json({ error: "Error interno al actualizar reserva" });
  }
});

// Eliminar reserva
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Reserva.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ error: "Reserva no encontrada" });
    // liberar artículo
    try {
      await Articulo.findByIdAndUpdate(eliminado.vehiculoId, { estado: "disponible" });
    } catch (err) {
      console.error("No se pudo actualizar artículo tras eliminar reserva:", err.message);
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando reserva:", error);
    res.status(500).json({ error: "Error interno al eliminar reserva" });
  }
});

export default router;
