<template>
    <div class="container-fluid mt-2">
        <!-- FILTROS -->
        <div class="container mb-4">
        <h3 class="mb-3">Filtrar Vehículos</h3>
            <div class="row g-3">
                <!-- Marca -->
                <div class="col-12 col-md-4">
                <label class="form-label">Marca</label>
                <select v-model="filtroMarca" class="form-select">
                    <option value="">Todas las marcas</option>
                    <option v-for="marca in marcasDisponibles" :key="marca" :value="marca">
                    {{ marca }}
                    </option>
                </select>
                </div>
                <!-- Combustible -->
                <div class="col-12 col-md-4">
                <label class="form-label">Combustible</label>
                <select v-model="filtroCombustible" class="form-select">
                    <option value="">Todos los combustibles</option>
                    <option v-for="tipo in combustiblesDisponibles" :key="tipo" :value="tipo">
                    {{ tipo }}
                    </option>
                </select>
                </div>
                <!-- Estado -->
                <div class="col-12 col-md-4">
                <label class="form-label">Estado</label>
                <select v-model="filtroEstado" class="form-select">
                    <option value="">Todos</option>
                    <option value="disponible">Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                </select>
                </div>
                <!-- Botón limpiar -->
                <div class="col-12 text-end">
                <button class="btn btn-secondary mt-2" @click="limpiarFiltros">
                    Limpiar filtros
                </button>
                </div>
            </div>
        </div>
        <div class="row g-4">
            <div 
            v-for="car in vehiculosFiltrados"
            :key="car._id"
            class="col-12 col-md-6 col-lg-3"
            >
                <div class="card h-80 shadow-sm">
                    <img
                        :src="urlImagen(car.imagen)"
                        class="img-fluid rounded shadow-sm"
                        alt="vehiculo"
                        style="height: 200px; object-fit: cover; cursor:pointer"
                        @click="verDetalles(car)"
                    />

                    <div class="card-body">
                        <h5 class="card-title">{{ car.marca }} {{ car.modelo }}</h5>
                        <p class="card-text">
                            <strong>Año:</strong>{{ car.anio }}<br>
                            <strong>Km:</strong>{{ car.kilometros }}<br>
                            <strong>Precio:</strong>{{ car.precio }}<br>
                        </p>
                    </div>

                    <div class="card-footer text-end bg-white">
                        <span class="badge bg-primary">{{ car.estado }}</span>
                        <button
                            class="btn badge btn-sm btn-success ms-2"
                            :class="car.estado === 'disponible' ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'"
                            :disabled="car.estado !== 'disponible'"
                            @click.stop="agregarACesta(car)">
                            <i class="bi bi-cart3 me-1"></i>
                            {{ car.estado === 'disponible' ? 'Agregar Cesta' : 'No disponible' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- MODAL DETALLES DEL COCHE -->
    <div
    v-if="mostrarModal"
    class="modal fade show"
    style="display: block; background: rgba(0,0,0,0.6)"
    >
    <div class="modal-dialog modal-lg">
        <div class="modal-content">

        <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
            <i class="bi bi-car-front me-2"></i>
            {{ cocheSeleccionado.marca }} {{ cocheSeleccionado.modelo }}
            </h5>
            <button class="btn-close" @click="mostrarModal = false"></button>
        </div>

        <div class="modal-body">
            <div class="text-center mb-3">
            <img
                :src="urlImagen(cocheSeleccionado.imagen)"
                class="img-fluid rounded shadow"
                style="max-height: 250px"
            />
            </div>

            <table class="table table-bordered">
            <tbody>
                <tr><th>Marca</th><td>{{ cocheSeleccionado.marca }}</td></tr>
                <tr><th>Modelo</th><td>{{ cocheSeleccionado.modelo }}</td></tr>
                <tr><th>Año</th><td>{{ cocheSeleccionado.anio }}</td></tr>
                <tr><th>Precio</th><td>{{ cocheSeleccionado.precio }} €</td></tr>
                <tr><th>Kilómetros</th><td>{{ cocheSeleccionado.kilometros }}</td></tr>
                <tr><th>Combustible</th><td>{{ cocheSeleccionado.combustible }}</td></tr>
                <tr><th>Transmisión</th><td>{{ cocheSeleccionado.transmision }}</td></tr>
                <tr><th>Potencia</th><td>{{ cocheSeleccionado.potencia_cv }} CV</td></tr>
                <tr><th>Estado</th><td>{{ cocheSeleccionado.estado }}</td></tr>
                <tr><th>Descripción</th><td>{{ cocheSeleccionado.descripcion }}</td></tr>
            </tbody>
            </table>
        </div>

        <div class="modal-footer">
            <button class="btn btn-secondary" @click="mostrarModal = false">
            Cerrar
            </button>

            <button class="btn btn-success" @click="imprimirPDF">
                <i class="bi bi-printer me-2"></i> Descargar PDF
            </button>
            <button
                class="btn btn-primary"
                @click="confirmarReserva(cocheSeleccionado)"
                v-if="cocheSeleccionado.estado === 'disponible' && !isAdmin"
            >
                <i class="bi bi-calendar-plus me-2"></i> Reservar Coche
            </button>
        </div>

        </div>
    </div>
    </div>

</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { getArticulos } from "@/api/articulos.js";
import { useCestaStore } from "@/store/cesta.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { crearReserva } from "@/api/reservas.js";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";



const filtroMarca = ref("");
const filtroCombustible = ref("");
const filtroEstado = ref("");

const marcasDisponibles = ref([]);
const combustiblesDisponibles = ref([]);
const cestaStore = useCestaStore(); 
const vehiculos = ref([]);
const mostrarModal = ref(false);
const cocheSeleccionado = ref(null);


onMounted(async () => {
    vehiculos.value = await getArticulos();

    marcasDisponibles.value = [
        ...new Set(
            vehiculos.value
                .map(v => v.marca)
                .filter((m) => m && m.trim() !== "")
        )
    ];

    combustiblesDisponibles.value = [
        ...new Set(
            vehiculos.value
                .map(v => v.combustible)
                .filter(c => c && c.trim() !== "")
        )
    ]

    const vendidos = JSON.parse(localStorage.getItem("cochesVendidos")) || [];

    vehiculos.value.forEach((coche) => {
        if (vendidos.includes(coche._id)) {
            coche.estado = "vendido";
        }
    });
});

const confirmarReserva = async (coche) => {
  const result = await Swal.fire({
    title: "Confirmar reserva",
    html: `
      <div class="text-start">
        <p><strong>Vehículo:</strong> ${coche.marca} ${coche.modelo}</p>
        <p><strong>Precio:</strong> ${coche.precio} €</p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Reservar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  await reservarVehiculo(coche);
};

const reservarVehiculo = async (coche) => {
  try {
    const token = sessionStorage.getItem("token");
        if (!token) {
            Swal.fire({
                icon: "warning",
                title: "Necesitas iniciar sesión",
                text: "Inicia sesión para poder reservar un vehículo.",
            });
            return;
        }

        let user;
        try {
            user = jwtDecode(token);
        } catch (err) {
            console.error("Token inválido al decodificar:", err);
            Swal.fire({
                icon: "error",
                title: "Token inválido",
                text: "Vuelve a iniciar sesión.",
            });
            return;
        }
        const reserva = {
                usuarioId: user.id || sessionStorage.getItem("id") || null,
                usuarioNombre: user.nombre || sessionStorage.getItem("userName") || "",
                usuarioEmail: user.email || sessionStorage.getItem("email") || "",
                vehiculoId: coche._id,
                nombreVehiculo: `${coche.marca} ${coche.modelo}`,
                fechaCreacion: new Date().toISOString(),
                estado: "pendiente"
        };

        if (!reserva.usuarioId) {
            console.error("usuarioId ausente en reserva, sessionStorage keys:", {
                tokenPresent: !!token,
                userFromToken: user,
                session_userName: sessionStorage.getItem("userName"),
                session_id: sessionStorage.getItem("id"),
            });
            Swal.fire({
                icon: "error",
                title: "No se pudo identificar al usuario",
                text: "Vuelve a iniciar sesión por favor.",
            });
            return;
        }

        console.log("Enviando reserva:", reserva, "token present:", !!token);

    await crearReserva(reserva);

    // Cambiar estado del coche a reservado en backend

    coche.estado = "reservado";

    Swal.fire({
        icon: "success",
        title: "Reserva realizada",
        text: "Tu reserva ha sido registrada correctamente.",
        timer: 2000,
        showConfirmButton: false,
    });

    mostrarModal.value = false;
    } catch (error) {
        console.error("Error al reservar vehículo:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo realizar la reserva. Inténtalo de nuevo.",
            timer: 2000,
        });
    }
};

const urlImagen = (ruta) => {
    if (!ruta) return "/no-image.png";
    return `http://localhost:5000${ruta}`
};

const agregarACesta = async (car) => {
    cestaStore.addProducto({
        id: car._id,
        nombre: `${car.marca} ${car.modelo}`,
        precio: car.precio,
        imagen: urlImagen(car.imagen),
    });

    // Guardar en backend
    await axios.patch(`http://localhost:5000/api/articulos/${car._id}`, {
        estado: "reservado"
    });

    // Reflejar en pantalla
    car.estado = "reservado";
};

const verDetalles = (car) => {
    cocheSeleccionado.value = car;
    mostrarModal.value = true;
}

const vehiculosFiltrados = computed(() => {
  return vehiculos.value.filter(v => {
    const coincideMarca = !filtroMarca.value || v.marca === filtroMarca.value;
    const coincideCombustible = !filtroCombustible.value || v.combustible === filtroCombustible.value;
    const coincideEstado = !filtroEstado.value || v.estado === filtroEstado.value;

    return coincideMarca && coincideCombustible && coincideEstado;
  });
});

const limpiarFiltros = () => {
  filtroMarca.value = "";
  filtroCombustible.value = "";
  filtroEstado.value = "";
};

const imprimirPDF = async () => {
  const car = cocheSeleccionado.value;
  const doc = new jsPDF("p", "mm", "a4");

  // COLORES
  const azul = [13, 110, 253];
  const gris = [240, 240, 240];

  // CABECERA
  doc.setFillColor(...azul);
  doc.rect(0, 0, 210, 25, "F");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Ficha del Vehículo", 105, 16, { align: "center" });

  let y = 35;

  // IMAGEN DEL VEHÍCULO
  if (car.imagen) {
    try {
      const imgBase64 = await fetch(urlImagen(car.imagen))
        .then(res => res.blob())
        .then(blob => new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        }));

      // Imagen centrada
      doc.addImage(imgBase64, "JPEG", 30, y, 150, 90);
      y += 105;
    } catch (error) {
      console.error("Error cargando imagen:", error);
    }
  }

  // SECCIÓN DATOS
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(...gris);
  doc.rect(10, y, 190, 10, "F");
  doc.text("Datos del Vehículo", 15, y + 7);
  y += 18;

  const datos = [
    ["Marca", car.marca],
    ["Modelo", car.modelo],
    ["Año", car.anio],
    ["Precio", `${car.precio} €`],
    ["Kilómetros", car.kilometros],
    ["Combustible", car.combustible],
    ["Transmisión", car.transmision],
    ["Potencia", `${car.potencia_cv} CV`],
    ["Estado", car.estado],
  ];

  datos.forEach(([campo, valor]) => {
    doc.setFontSize(12);
    doc.text(`${campo}:`, 15, y);
    doc.text(String(valor || "N/A"), 70, y);
    y += 8;
  });

  // SECCIÓN DESCRIPCIÓN
  y += 5;
  doc.setFillColor(...gris);
  doc.rect(10, y, 190, 10, "F");
  doc.text("Descripción", 15, y + 7);
  y += 15;

  doc.setFontSize(12);
  doc.text(car.descripcion || "Sin descripción", 15, y, { maxWidth: 180 });

  // GUARDAR PDF
  doc.save(`vehiculo_${car.marca}_${car.modelo}.pdf`);
};


</script>

<style scoped>
.card-title{
    font-weight: bold;
    text-transform: capitalize;
}
</style>