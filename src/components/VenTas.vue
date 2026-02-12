<template>
    <div class="container-fluid mt-2">
        <div class="row g-4">
            <div 
            v-for="car in vehiculos"
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
                    ></img>

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
        </div>

        </div>
    </div>
    </div>

</template>
<script setup>
import { ref, onMounted } from "vue";
import { getArticulos } from "@/api/articulos.js";
import { useCestaStore } from "@/store/cesta.js";
import jsPDF from "jspdf";
import "jspdf-autotable";

const cestaStore = useCestaStore(); 
const vehiculos = ref([]);
const mostrarModal = ref(false);
const cocheSeleccionado = ref(null);

onMounted(async () => {
    vehiculos.value = await getArticulos();

    const vendidos = JSON.parse(localStorage.getItem("cochesVendidos")) || [];

    vehiculos.value.forEach((coche) => {
        if (vendidos.includes(coche._id)) {
            coche.estado = "vendido";
        }
    });
});

const urlImagen = (ruta) => {
    if (!ruta) return "/no-image.png";
    return `http://localhost:5000${ruta}`
};

const agregarACesta = (car) => {
    // Añadir a la cesta
    cestaStore.addProducto({
        id: car._id,
        nombre: `${car.marca} ${car.modelo}`,
        precio: car.precio,
        imagen: urlImagen(car.imagen),
    });

    // Cambiar estado del coche
    car.estado = "reservado";
}

const verDetalles = (car) => {
    cocheSeleccionado.value = car;
    mostrarModal.value = true;
}

const imprimirPDF = () => {
    const car = cocheSeleccionado.value;
    const doc = new jsPDF();

    doc.setFontSize(16)
    doc.text(`Ficha del vehículo`, 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Marca: ${car.marca}`, 20, 30);
    doc.text(`Modelo: ${car.modelo}`, 20, 40);
    doc.text(`Año: ${car.anio}`, 20, 50);
    doc.text(`Precio: ${car.precio}`, 20, 60);
    doc.text(`Kilómetros: ${car.kilometros}`, 20, 70);
    doc.text(`Combustible: ${car.combustible}`, 20, 80);
    doc.text(`Transmisión: ${car.transmision}`, 20, 90);
    doc.text(`Potencia: ${car.potencia_cv}`, 20, 100);
    doc.text(`Estado: ${car.estado}`, 20, 110);

    doc.text(`Precio: ${car.precio}`, 20, 125);
    doc.text(car.descripcion || "Sin descripción", 20, 135, { maxWidth: 170});

    doc.save(`vehículo_${car.marca}_${car.modelo}.pdf`);
}

</script>

<style scoped>
.card-title{
    font-weight: bold;
    text-transform: capitalize;
}
</style>