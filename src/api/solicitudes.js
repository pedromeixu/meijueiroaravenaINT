import axios from "axios";

const API_URL = "http://localhost:5000/api/solicitudes";

export const addSolicitud = (formData) => {
  return axios
    .post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const getSolicitudes = () => {
  return axios.get(API_URL).then((res) => {
    // Normalizar nombre de campo de fecha que usa el frontend
    return res.data.map((s) => ({
      ...s,
      fechaSolicitud: s.fechaSolicitud || s.fechaCreacion || s.fecha || null,
    }));
  });
};

export const deleteSolicitud = (id) => {
  return axios.delete(`${API_URL}/${id}`).then((res) => res.data);
};
