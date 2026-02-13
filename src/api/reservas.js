import axios from "axios";

const API_URL = "http://localhost:5000/api/reservas";

export const getReservas = (usuarioId, esAdmin) => {
  // Se intenta pasar usuarioId y esAdmin como query params; el backend puede adaptarse.
  return axios
    .get(API_URL, { params: { usuarioId, esAdmin } })
    .then((res) => res.data);
};

export const updateEstadoReserva = (id, nuevoEstado) => {
  // Usar PATCH para actualizar solo el estado
  return axios
    .patch(`${API_URL}/${id}`, { estado: nuevoEstado })
    .then((res) => res.data);
};

export const deleteReserva = (id) => {
  return axios.delete(`${API_URL}/${id}`).then((res) => res.data);
};

export const crearReserva = (reserva) => {
    return axios.post(API_URL, reserva).then((res) => res.data);
}