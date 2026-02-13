<template>
  <div class="container mx-auto my-4 p-4 border rounded-4 shadow-lg bg-light">
    <h3 class="text-center my-3 empleo-header">
      <i class="bi bi-briefcase-fill me-2"></i>Solicitud de Empleo
    </h3>

    <div v-if="isAdmin" class="alert alert-warning text-center">
      <i class="bi bi-exclamation-triangle me-2"></i>
      Los administradores no pueden enviar solicitudes de empleo.
    </div>

    <form v-else @submit.prevent="enviarSolicitud" class="mb-4">
      <!-- Nombre y Apellidos -->
      <div class="mb-3 row g-3">
        <div class="col-md-6">
          <label for="nombre" class="form-label fw-medium">Nombre *</label>
          <input
            type="text"
            id="nombre"
            v-model="solicitud.nombre"
            @blur="capitalizarTexto('nombre')"
            class="form-control rounded shadow-none border"
            required
          />
        </div>
        <div class="col-md-6">
          <label for="apellidos" class="form-label fw-medium">Apellidos *</label>
          <input
            type="text"
            id="apellidos"
            v-model="solicitud.apellidos"
            @blur="capitalizarTexto('apellidos')"
            class="form-control rounded shadow-none border"
            required
          />
        </div>
      </div>

      <!-- Email y Teléfono -->
      <div class="mb-3 row g-3">
        <div class="col-md-6">
          <label for="email" class="form-label fw-medium">Email *</label>
          <input
            type="email"
            id="email"
            v-model="solicitud.email"
            @blur="validarEmail"
            class="form-control rounded shadow-none border"
            :class="{ 'is-invalid': !emailValido }"
            required
          />
          <div v-if="!emailValido" class="invalid-feedback">
            Email inválido
          </div>
        </div>
        <div class="col-md-6">
          <label for="telefono" class="form-label fw-medium">Teléfono *</label>
          <input
            type="tel"
            id="telefono"
            v-model="solicitud.telefono"
            @blur="validarTelefono"
            class="form-control rounded shadow-none border"
            :class="{ 'is-invalid': !telefonoValido }"
            required
          />
          <div v-if="!telefonoValido" class="invalid-feedback">
            Teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9
          </div>
        </div>
      </div>

      <!-- Dirección -->
      <div class="mb-3">
        <label for="direccion" class="form-label fw-medium">Dirección *</label>
        <input
          type="text"
          id="direccion"
          v-model="solicitud.direccion"
          @blur="capitalizarTexto('direccion')"
          class="form-control rounded shadow-none border"
          required
        />
      </div>

      <!-- Provincia y Municipio -->
      <div class="mb-3 row g-3">
        <div class="col-md-6">
          <label for="provincia" class="form-label fw-medium">Provincia *</label>
          <select
            id="provincia"
            v-model="solicitud.provincia"
            class="form-select rounded shadow-none border"
            @change="filtrarMunicipios"
            required
          >
            <option disabled value="">Seleccione provincia</option>
            <option v-for="prov in provincias" :key="prov.id" :value="prov.nm">
              {{ prov.nm }}
            </option>
          </select>
        </div>
        <div class="col-md-6">
          <label for="municipio" class="form-label fw-medium">Municipio *</label>
          <select
            id="municipio"
            v-model="solicitud.municipio"
            class="form-select rounded shadow-none border"
            required
          >
            <option disabled value="">Seleccione municipio</option>
            <option v-for="mun in municipiosFiltrados" :key="mun.id" :value="mun.nm">
              {{ mun.nm }}
            </option>
          </select>
        </div>
      </div>

      <!-- Foto -->
      <div class="mb-3">
        <label for="foto" class="form-label fw-medium">Fotografía</label>
        <input
          type="file"
          id="foto"
          accept="image/*"
          @change="onFileChange"
          class="form-control rounded shadow-none border"
        />
        <small class="text-muted">Formatos permitidos: JPG, PNG, GIF (opcional)</small>
      </div>

      <!-- Botones -->
      <div class="text-center mt-4">
        <button type="submit" class="btn btn-primary px-5 me-3" :disabled="enviando">
          <span v-if="enviando">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Enviando...
          </span>
          <span v-else>
            <i class="bi bi-send me-2"></i>Enviar Solicitud
          </span>
        </button>
        <button type="button" class="btn btn-secondary px-5" @click="limpiarFormulario">
          <i class="bi bi-x-circle me-2"></i>Limpiar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { addSolicitud } from "@/api/solicitudes.js";
import provmuniData from "@/data/provmuni.json";
import Swal from "sweetalert2";

const isAdmin = ref(sessionStorage.getItem("isAdmin") === "true");

const solicitud = ref({
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  direccion: "",
  provincia: "",
  municipio: "",
});

const archivo = ref(null);
const enviando = ref(false);
const emailValido = ref(true);
const telefonoValido = ref(true);

const provincias = ref(provmuniData.provincias);
const municipios = ref(provmuniData.municipios);
const municipiosFiltrados = ref([]);

const filtrarMunicipios = () => {
  const nombreProv = solicitud.value.provincia;
  const prov = provincias.value.find((p) => p.nm === nombreProv);
  if (!prov) {
    municipiosFiltrados.value = [];
    return;
  }
  const codigoProv = prov.id.slice(0, 2);
  municipiosFiltrados.value = municipios.value.filter((m) => m.id.startsWith(codigoProv));
  solicitud.value.municipio = "";
};

const capitalizarTexto = (campo) => {
  const texto = solicitud.value[campo] ?? "";
  solicitud.value[campo] = texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => {
      if (!palabra) return "";
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
};

const validarEmail = () => {
  const email = solicitud.value.email.trim();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  emailValido.value = regex.test(email);
};

const validarTelefono = () => {
  const telefono = solicitud.value.telefono.trim();
  const regex = /^[6789]\d{8}$/;
  telefonoValido.value = regex.test(telefono);
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    archivo.value = file;
  }
};

const enviarSolicitud = async () => {
  // forzar validaciones por si el usuario no ha salido de los campos
  validarEmail();
  validarTelefono();

  if (!emailValido.value || !telefonoValido.value) {
    Swal.fire({
      icon: "error",
      title: "Datos inválidos",
      text: "Por favor, revise el email y teléfono.",
      timer: 2000,
    });
    return;
  }

  const result = await Swal.fire({
    title: "¿Enviar solicitud de empleo?",
    text: "Se enviará tu información al equipo de recursos humanos.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, enviar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  enviando.value = true;

  try {
    const formData = new FormData();
    formData.append("nombre", solicitud.value.nombre);
    formData.append("apellidos", solicitud.value.apellidos);
    formData.append("email", solicitud.value.email);
    formData.append("telefono", solicitud.value.telefono);
    formData.append("direccion", solicitud.value.direccion);
    formData.append("provincia", solicitud.value.provincia);
    formData.append("municipio", solicitud.value.municipio);

    if (archivo.value) {
      formData.append("foto", archivo.value);
    }

    await addSolicitud(formData);

    Swal.fire({
      icon: "success",
      title: "¡Solicitud enviada!",
      text: "Gracias por tu interés. Nos pondremos en contacto contigo pronto.",
      timer: 3000,
      showConfirmButton: false,
    });

    limpiarFormulario();
  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    Swal.fire({
      icon: "error",
      title: "Error al enviar",
      text: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      timer: 2000,
    });
  } finally {
    enviando.value = false;
  }
};

const limpiarFormulario = () => {
  solicitud.value = {
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    direccion: "",
    provincia: "",
    municipio: "",
  };
  archivo.value = null;
  emailValido.value = true;
  telefonoValido.value = true;
  municipiosFiltrados.value = [];

  const inputFile = document.getElementById("foto");
  if (inputFile) inputFile.value = "";
};
</script>

<style scoped>
.empleo-header {
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

.is-invalid {
  border-color: #f28b82 !important;
  background-color: #ffe6e6;
}

.invalid-feedback {
  display: block;
}
</style>