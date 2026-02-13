import axios from "axios";

const API_URL = "http://localhost:3000/taller";

/**
 * Obtener todas las citas de taller
 * @returns {Array} Lista de noticias desde la API
 */
export async function getCitas() {
  try {
    const res = await axios.get(API_URL);
    // Aseguramos que siempre sea un array
    if (Array.isArray(res.data)) {
      return res.data;
    } else {
      console.warn("getCita: La API no devolvió un array, usando fallback vacío");
      return [];
    }
  } catch (error) {
    console.error("Error al conseguir las citas:", error);
  }
}


/**
 * Añadir una nueva cita
 * @param {Object} cita - Objeto con los datos de la citas
 */
export const addCita = async (nuevaCita) => {
    try {
        const res = await axios.post(API_URL, nuevaCita);
        return res.data;
    } catch (error) {
        console.error("❌ Error al añadir la cita:", error);
        throw error;
    }
};

/**
 * Actualizar una noticia existente
 * @param {string|number} id - ID de la cita
 * @param {Object} citaActualizado- Datos actualizados de la citas taller
 */
export const updateCita = async (id, citaActualizado) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, citaActualizado);
        return res.data;
    } catch (error) {
        console.error(`❌ Error al actualizar la cita del taller con ID ${id}:`, error);
        throw error;
    }
};

/**
 * Eliminar cita por ID
 * @param {string|number} id - ID de la cita a eliminar
 */
export const deleteCita = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error(`❌ Error al eliminar la cita del taller con ID ${id}:`, error);
        throw error;
    }
};
