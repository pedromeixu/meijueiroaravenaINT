import mongoose from "mongoose";

const SolicitudSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    provincia: { type: String, required: true },
    municipio: { type: String, required: true },
    foto: { type: String },
    fechaCreacion: { type: Date, default: Date.now },
  },
  { collection: "solicitudes" }
);

export default mongoose.model("Solicitud", SolicitudSchema);
