<template>
  <div class="container mx-auto my-4 p-4 border rounded-4 shadow-lg bg-light">
    <h3 class="text-center my-3 solicitudes-header">
      <i class="bi bi-folder2-open me-2"></i>Solicitudes de Empleo
    </h3>

    <div v-if="!isAdmin" class="alert alert-danger text-center">
      <i class="bi bi-shield-exclamation me-2"></i>
      No tienes permisos para acceder a esta página.
    </div>

    <div v-else>
      <div v-if="solicitudes.length === 0" class="alert alert-info text-center">
        <i class="bi bi-info-circle me-2"></i>
        No hay solicitudes de empleo pendientes.
      </div>

      <div v-else class="row g-4">
        <div 
          v-for="(solicitud, index) in solicitudes" 
          :key="solicitud.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <div class="card solicitud-card h-100 shadow-sm" @click="verDetalles(solicitud)">
            <div class="card-header text-center bg-primary text-white">
              <strong>Solicitud #{{ index + 1 }}</strong>
            </div>
            <div class="card-body text-center">
              <div class="foto-container mb-3">
                <img
                  v-if="solicitud.foto"
                  :src="urlFoto(solicitud.foto)"
                  alt="Foto candidato"
                  class="foto-card"
                />
                <i v-else class="bi bi-person-circle display-1 text-secondary"></i>
              </div>
              <h5 class="card-title mb-1">{{ solicitud.nombre }} {{ solicitud.apellidos }}</h5>
              <p class="text-muted small mb-2">
                <i class="bi bi-envelope me-1"></i>{{ solicitud.email }}
              </p>
              <p class="text-muted small mb-2">
                <i class="bi bi-telephone me-1"></i>{{ solicitud.telefono }}
              </p>
              <p class="text-muted small mb-2">
                <i class="bi bi-geo-alt me-1"></i>{{ solicitud.municipio }}, {{ solicitud.provincia }}
              </p>
              <p class="text-muted small">
                <i class="bi bi-calendar me-1"></i>{{ formatearFechaCorta(solicitud.fechaSolicitud) }}
              </p>
            </div>
            <div class="card-footer text-center bg-light" @click.stop>
              <button
                @click="eliminarSolicitud(solicitud.id)"
                class="btn btn-danger btn-sm"
                title="Eliminar solicitud"
              >
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalles -->
    <div 
      v-if="solicitudSeleccionada"
      class="modal fade show d-block" 
      tabindex="-1"
      @click.self="cerrarModal"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-person-badge me-2"></i>
              Detalles de la Solicitud
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="cerrarModal"></button>
          </div>
          <div class="modal-body" id="contenido-imprimir">
            <div class="row">
              <div class="col-md-4 text-center mb-3">
                <img
                  v-if="solicitudSeleccionada.foto"
                  :src="urlFoto(solicitudSeleccionada.foto)"
                  alt="Foto candidato"
                  class="foto-modal mb-3"
                />
                <i v-else class="bi bi-person-circle display-1 text-secondary mb-3"></i>
              </div>
              <div class="col-md-8">
                <h4 class="mb-3">{{ solicitudSeleccionada.nombre }} {{ solicitudSeleccionada.apellidos }}</h4>
                
                <div class="detalle-item mb-2">
                  <strong><i class="bi bi-envelope-fill me-2 text-primary"></i>Email:</strong>
                  <span>{{ solicitudSeleccionada.email }}</span>
                </div>
                
                <div class="detalle-item mb-2">
                  <strong><i class="bi bi-telephone-fill me-2 text-primary"></i>Teléfono:</strong>
                  <span>{{ solicitudSeleccionada.telefono }}</span>
                </div>
                
                <div class="detalle-item mb-2">
                  <strong><i class="bi bi-house-fill me-2 text-primary"></i>Dirección:</strong>
                  <span>{{ solicitudSeleccionada.direccion }}</span>
                </div>
                
                <div class="detalle-item mb-2">
                  <strong><i class="bi bi-geo-alt-fill me-2 text-primary"></i>Provincia:</strong>
                  <span>{{ solicitudSeleccionada.provincia }}</span>
                </div>
                
                <div class="detalle-item mb-2">
                  <strong><i class="bi bi-pin-map-fill me-2 text-primary"></i>Municipio:</strong>
                  <span>{{ solicitudSeleccionada.municipio }}</span>
                </div>
                
                <div class="detalle-item mb-2">
                  <strong><i class="bi bi-calendar-check me-2 text-primary"></i>Fecha de Solicitud:</strong>
                  <span>{{ formatearFecha(solicitudSeleccionada.fechaSolicitud) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" @click="imprimirSolicitud">
              <i class="bi bi-printer me-2"></i>Imprimir
            </button>
            <button type="button" class="btn btn-secondary" @click="cerrarModal">
              <i class="bi bi-x-circle me-2"></i>Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="solicitudSeleccionada" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getSolicitudes, deleteSolicitud } from "@/api/solicitudes.js";
import Swal from "sweetalert2";

const isAdmin = ref(sessionStorage.getItem("isAdmin") === "true");
const solicitudes = ref([]);
const solicitudSeleccionada = ref(null);

const cargarSolicitudes = async () => {
  try {
    solicitudes.value = await getSolicitudes();
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar las solicitudes.",
      timer: 2000,
    });
  }
};

const verDetalles = (solicitud) => {
  solicitudSeleccionada.value = solicitud;
};

const cerrarModal = () => {
  solicitudSeleccionada.value = null;
};

const imprimirSolicitud = () => {
  const contenido = document.getElementById("contenido-imprimir");
  const ventanaImpresion = window.open("", "", "height=600,width=800");
  
  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>Solicitud de Empleo - ${solicitudSeleccionada.value.nombre} ${solicitudSeleccionada.value.apellidos}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0d6efd;
            padding-bottom: 10px;
          }
          .foto-impresion {
            max-width: 150px;
            max-height: 150px;
            border-radius: 8px;
            margin: 20px auto;
            display: block;
          }
          .detalle {
            margin: 10px 0;
            padding: 8px;
            background-color: #f8f9fa;
            border-left: 3px solid #0d6efd;
          }
          .detalle strong {
            color: #0d6efd;
            display: inline-block;
            width: 150px;
          }
          h1 {
            color: #0d6efd;
            font-size: 24px;
          }
          h2 {
            color: #333;
            font-size: 20px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SOLICITUD DE EMPLEO</h1>
          <p>TeisMotor - Recursos Humanos</p>
        </div>
  `);

  if (solicitudSeleccionada.value.foto) {
    ventanaImpresion.document.write(`
      <img src="${urlFoto(solicitudSeleccionada.value.foto)}" alt="Foto candidato" class="foto-impresion" />
    `);
  }

  ventanaImpresion.document.write(`
        <h2>${solicitudSeleccionada.value.nombre} ${solicitudSeleccionada.value.apellidos}</h2>
        
        <div class="detalle">
          <strong>Email:</strong> ${solicitudSeleccionada.value.email}
        </div>
        
        <div class="detalle">
          <strong>Teléfono:</strong> ${solicitudSeleccionada.value.telefono}
        </div>
        
        <div class="detalle">
          <strong>Dirección:</strong> ${solicitudSeleccionada.value.direccion}
        </div>
        
        <div class="detalle">
          <strong>Provincia:</strong> ${solicitudSeleccionada.value.provincia}
        </div>
        
        <div class="detalle">
          <strong>Municipio:</strong> ${solicitudSeleccionada.value.municipio}
        </div>
        
        <div class="detalle">
          <strong>Fecha Solicitud:</strong> ${formatearFecha(solicitudSeleccionada.value.fechaSolicitud)}
        </div>
        
        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}</p>
          <p>© TeisMotor - Sistema de Gestión de Recursos Humanos</p>
        </div>
      </body>
    </html>
  `);

  ventanaImpresion.document.close();
  ventanaImpresion.focus();
  
  setTimeout(() => {
    ventanaImpresion.print();
    ventanaImpresion.close();
  }, 250);
};

const eliminarSolicitud = async (id) => {
  const result = await Swal.fire({
    title: "¿Eliminar solicitud?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    await deleteSolicitud(id);
    Swal.fire({
      icon: "success",
      title: "Solicitud eliminada",
      timer: 1500,
      showConfirmButton: false,
    });
    cerrarModal();
    await cargarSolicitudes();
  } catch (error) {
    console.error("Error al eliminar solicitud:", error);
    Swal.fire({
      icon: "error",
      title: "Error al eliminar",
      text: "No se pudo eliminar la solicitud.",
      timer: 2000,
    });
  }
};

const urlFoto = (ruta) => {
  if (!ruta) return "";
  return `http://localhost:5000${ruta}`;
};

const formatearFecha = (fecha) => {
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

const formatearFechaCorta = (fecha) => {
  if (!fecha) return "";
  const date = new Date(fecha);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

onMounted(() => {
  if (isAdmin.value) {
    cargarSolicitudes();
  }
});
</script>

<style scoped>
.solicitudes-header {
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

.solicitud-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e0e0e0;
}

.solicitud-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.foto-container {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.foto-card {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #0d6efd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.foto-modal {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 10px;
  border: 3px solid #0d6efd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detalle-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detalle-item strong {
  display: block;
  margin-bottom: 4px;
  color: #333;
}

.detalle-item span {
  display: block;
  color: #666;
  padding-left: 28px;
}

.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-backdrop {
  --bs-backdrop-opacity: 0.5;
}

.card-title {
  color: #0d6efd;
  font-weight: 600;
}

.card-footer {
  background-color: #f8f9fa !important;
  border-top: 2px solid #e0e0e0;
}
</style>