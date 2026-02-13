<template>
  <div class="container mx-auto my-4 p-4 border rounded-4 shadow-lg bg-light">
    <h3 class="text-center my-3 gestion-header">
      <i class="bi bi-calendar2-check me-2"></i>
      {{ isAdmin ? 'Gestión de Reservas' : 'Mis Reservas' }}
    </h3>

    <div v-if="reservas.length === 0" class="alert alert-info text-center">
      <i class="bi bi-info-circle me-2"></i>
      No hay reservas {{ isAdmin ? 'registradas en el sistema' : 'activas' }}.
    </div>

    <div v-else class="row g-4">
      <div
        v-for="(reserva, index) in reservas"
        :key="reserva.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card reserva-card h-100 shadow-sm">
          <div class="card-header text-center bg-primary text-white">
            <strong>#{{ index + 1 }} - {{ reserva.nombreVehiculo }}</strong>
          </div>
          <div class="card-body">
            <div class="mb-2">
              <strong><i class="bi bi-person-fill me-2 text-primary"></i>Cliente:</strong>
              <p class="mb-0 text-muted">{{ reserva.usuarioNombre }}</p>
            </div>

            <div class="mb-2">
              <strong><i class="bi bi-envelope-fill me-2 text-primary"></i>Email:</strong>
              <p class="mb-0 text-muted small">{{ reserva.usuarioEmail }}</p>
            </div>

            <div class="mb-2">
              <strong><i class="bi bi-clock-fill me-2 text-primary"></i>Fecha de Reserva:</strong>
              <p class="mb-0 text-muted small">{{ formatearFechaCompleta(reserva.fechaCreacion) }}</p>
            </div>

            <div class="mb-2">
              <strong><i class="bi bi-info-circle-fill me-2 text-primary"></i>Estado:</strong>
              <span class="badge" :class="getBadgeClass(reserva.estado)">
                {{ reserva.estado.toUpperCase() }}
              </span>
            </div>
          </div>
          <div class="card-footer text-center bg-light">
            <button
              v-if="reserva.estado === 'pendiente' && isAdmin"
              @click="cambiarEstado(reserva.id, 'confirmada')"
              class="btn btn-success btn-sm me-2"
              title="Confirmar"
            >
              <i class="bi bi-check-lg"></i>
            </button>
            <button
              v-if="reserva.estado !== 'cancelada'"
              @click="cancelarReserva(reserva.id)"
              class="btn btn-warning btn-sm me-2"
              title="Cancelar Reserva"
            >
              <i class="bi bi-x-lg"></i>
            </button>
            <button
              v-if="isAdmin"
              @click="eliminarReserva(reserva.id)"
              class="btn btn-danger btn-sm"
              title="Eliminar"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getReservas, updateEstadoReserva, deleteReserva } from "@/api/reservas.js";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

const isAdmin = ref(sessionStorage.getItem("isAdmin") === "true");
const reservas = ref([]);

// Obtener datos del usuario desde el token
const obtenerDatosUsuario = () => {
  const token = sessionStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return {
      id: decoded.id,
      nombre: decoded.nombre || "Usuario",
      email: decoded.email || "",
    };
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};

const cargarReservas = async () => {
  try {
    const usuario = obtenerDatosUsuario();
    if (!usuario) {
      Swal.fire({
        icon: "error",
        title: "Sesión requerida",
        text: "Debes iniciar sesión para ver las reservas.",
        timer: 2000,
      });
      return;
    }

    reservas.value = await getReservas(usuario.id, isAdmin.value);
  } catch (error) {
    console.error("Error al cargar reservas:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar las reservas.",
      timer: 2000,
    });
  }
};

const cambiarEstado = async (id, nuevoEstado) => {
  try {
    if (!id) {
      console.error("cambiarEstado recibido id inválido:", id);
      Swal.fire({ icon: "error", title: "Error", text: "ID de reserva inválido." });
      return;
    }
    await updateEstadoReserva(id, nuevoEstado);
    Swal.fire({
      icon: "success",
      title: "Estado actualizado",
      timer: 1500,
      showConfirmButton: false,
    });
    await cargarReservas();
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar el estado.",
      timer: 2000,
    });
  }
};

const cancelarReserva = async (id) => {
  const result = await Swal.fire({
    title: "¿Cancelar reserva?",
    text: "El vehículo quedará disponible nuevamente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No",
  });

  if (!result.isConfirmed) return;

  await cambiarEstado(id, "cancelada");
};

const eliminarReserva = async (id) => {
  const result = await Swal.fire({
    title: "¿Eliminar reserva?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    await deleteReserva(id);
    Swal.fire({
      icon: "success",
      title: "Reserva eliminada",
      timer: 1500,
      showConfirmButton: false,
    });
    await cargarReservas();
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la reserva.",
      timer: 2000,
    });
  }
};

const formatearFechaCompleta = (fecha) => {
  if (!fecha) return "";
  const date = new Date(fecha);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getBadgeClass = (estado) => {
  switch (estado) {
    case "pendiente":
      return "bg-warning";
    case "confirmada":
      return "bg-success";
    case "cancelada":
      return "bg-danger";
    case "completada":
      return "bg-info";
    default:
      return "bg-secondary";
  }
};

onMounted(() => {
  cargarReservas();
});
</script>

<style scoped>
.gestion-header {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background-color: #b5caff;
  color: #03306b;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

.reserva-card {
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.reserva-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15) !important;
}

.card-footer {
  background-color: #f8f9fa !important;
  border-top: 2px solid #e0e0e0;
}
</style>