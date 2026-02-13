import mongoose from "mongoose";

const ReservaSchema = new mongoose.Schema(
  {
    usuarioId: { type: String, required: true },
    usuarioNombre: { type: String, required: true },
    usuarioEmail: { type: String, required: true },
    vehiculoId: { type: String, required: true },
    nombreVehiculo: { type: String },
    fechaCreacion: { type: Date, default: Date.now },
    estado: { type: String, default: "pendiente" },
  },
  { collection: "reservas" }
);

export default mongoose.model("Reserva", ReservaSchema);
