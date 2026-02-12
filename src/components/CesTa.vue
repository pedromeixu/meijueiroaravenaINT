<template>
  <div class="container mt-4">
    <h2>Mi Cesta</h2>

    <div v-if="cesta.items.length === 0" class="alert alert-info">
      La cesta está vacía.
    </div>

    <div v-else>
      <table class="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cesta.items" :key="item.id">
            <td>{{ item.nombre }}</td>
            <td>{{ item.precio }}</td>
            <td>
              <button
                class="btn btn-sm btn-outline-secondary me-1"
                @click="decrementar(item.id)"
              >
                -
              </button>
              {{ item.cantidad }}
              <button
                class="btn btn-sm btn-outline-secondary ms-1"
                @click="incrementar(item.id)"
              >
                +
              </button>
            </td>
            <td>{{ item.precio * item.cantidad }}</td>
            <td>
              <button
                class="btn btn-sm btn-danger"
                @click="removeProducto(item.id)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="fw-bold">
            <td colspan="3" class="text-end">Total:</td>
            <td>
              <div v-if="descuentoAplicado">
                <span class="text-decoration-line-through text-danger">
                  {{ cesta.totalPrecio.toFixed(2) }}€
                </span>
                <br>
                <strong class="text-success">
                  {{totalConDescuento.toFixed(2) }}€
                </strong>
              </div>

              <div v-else>
                {{ cesta.totalPrecio.toFixed(2) }}€
              </div>
            </td>
            <td>
              <!-- BOTÓN DESCUENTO-->
              <button
              v-if="!descuentoAplicado"
              class="btn btn-warning btn-sm"
              @click="aplicarDescuentoToyota"
              >
              Descuento Toyota
              </button>
              <div class="d-flex align-items-center mt-2">
                <input
                  type="text"
                  v-model="cupon"
                  placeholder="Código de cupón"
                  class="form-control form-control-sm w-50 me-2"
                ></input>
                <button
                  class="btn btn-info btn-sm"
                  @click="aplicarCupon"
                >
                Aplicar cupón
                </button>
              </div>
              <button
                class="btn btn-success btn-sm justify-content-end mx-3"
                @click="mostrarResumen = true"
              >
                Pago
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
<!-- Modal de resumen de compra -->
<div
  class="modal fade show"
  tabindex="-1"
  style="display: block; background: rgba(0,0,0,0.5)"
  v-if="mostrarResumen"
>
  <div class="modal-dialog modal-lg">
    <div class="modal-content">

      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="bi bi-receipt me-2"></i> Resumen de la compra
        </h5>
        <button type="button" class="btn-close" @click="mostrarResumen = false"></button>
      </div>

      <div class="modal-body">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cesta.items" :key="item.id">
              <td>{{ item.nombre }}</td>
              <td>{{ item.precio }}€</td>
              <td>{{ item.cantidad }}</td>
              <td>{{ (item.precio * item.cantidad).toFixed(2) }}€</td>
            </tr>
          </tbody>
        </table>

        <h5 class="text-end mt-3">
          Total: <strong>{{ cesta.totalPrecio.toFixed(2) }}€</strong>
        </h5>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="mostrarResumen = false">
          Cancelar
        </button>
        <button class="btn btn-success" @click="confirmarPago">
          Aceptar y pagar
        </button>
      </div>

    </div>
  </div>
</div>

</template>

<script setup>
import { ref, computed } from "vue"; 
import { useCestaStore } from "@/store/cesta.js";
import axios from "axios";
import Swal from "sweetalert2";

const cesta = useCestaStore();

const incrementar = (id) => cesta.incrementar(id);
const decrementar = (id) => cesta.decrementar(id);
const removeProducto = (id) => cesta.removeProducto(id);
const cupon = ref("");
const descuentoAplicado = ref(false);
const mostrarResumen = ref(false);
const descuento = ref(0);

const mostrarAlerta = (title, text, icon) => {
  Swal.fire({ title, text, icon });
};

const aplicarDescuentoToyota = () => {
  cesta.aplicarDescuentoToyota();
  descuentoAplicado.value = true;
  mostrarAlerta("Descuento aplicado", "Se ha aplicado un descuento a los Toyota", "success");
};

// Iniciar pago con Stripe usando axios
const iniciarPago = async () => {
  if (!cesta.items.length) {
    mostrarAlerta("Aviso", "La cesta está vacía", "warning");
    return;
  }

  // Verificar si el usuario está registrado/autenticado
  const token = sessionStorage.getItem('token');
  if (!token) {
    mostrarAlerta(
      "Autenticación requerida", 
      "Debes iniciar sesión o registrarte para realizar una compra", 
      "warning"
    );
    return;
  }

  try {
    // GUARDAR los datos del carrito en localStorage ANTES de ir a Stripe
    localStorage.setItem('ultimaCompra', JSON.stringify({
      items: cesta.items,
      total: cesta.totalPrecio,
      fecha: new Date().toISOString()
    }));

    // GUARDAR los coches vendidos
    localStorage.setItem("cochesVendidos", JSON.stringify(
      cesta.items.map((i) => {
        i.id;
      })
    ));

    // Crear la sesión de pago en el backend
    const response = await axios.post(
      "http://localhost:5000/create-checkout-session",
      {
        items: cesta.items,
        amount: cesta.totalPrecio,
      },
    );

    const session = response.data;

    if (!session.url) {
      console.error("❌ No se recibió URL de Stripe.");
      mostrarAlerta("Error", "No se pudo iniciar el pago", "error");
      return;
    }

    // Redirigir directamente al checkout de Stripe
    window.location.href = session.url;
  } catch (error) {
    console.error("Error en iniciarPago:", error);
    mostrarAlerta("Error", "No se pudo iniciar el pago", "error");
  }
};

const confirmarPago = () => {
  mostrarResumen.value = false;
  iniciarPago();
}

const aplicarCupon = () => {
  if (descuentoAplicado.value) {
    mostrarAlerta("Cupón ya aplicado", "Solo puedes usar un cupón por compra", "info");
    return;
  }

  if (cupon.value.trim().toUpperCase() === "DESCUENTO10") {
    descuento.value = cesta.totalPrecio * 0.10;
    descuentoAplicado.value = true;

    mostrarAlerta("Cupón aplicado", "Se ha aplicado un 10% de descuento", "success");
  } else {
    mostrarAlerta("Cupón inválido", "El código introducido no es válido", "error");
  }
}

const totalConDescuento = computed(() => {
  return cesta.totalPrecio - descuento.value;
});

</script>

<style scoped></style>
