import { db } from "../../../firebase.config"; // Asegúrate que esta ruta coincida con tu archivo firebase
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const useRecepcion = () => {
  
  // 1. CHECK-IN: Guarda Cliente y Ocupa Habitación
  const realizarCheckIn = async (habitacionId, datosFormulario, precioCobrado) => {
    try {
      // A. Preparar datos del Cliente para guardarlos limpios
      const cedulaLimpia = datosFormulario.cedula.trim().toUpperCase();
      
      const datosCliente = {
        cedula: cedulaLimpia,
        primerNombre: datosFormulario.primerNombre.trim(),
        segundoNombre: datosFormulario.segundoNombre.trim(),
        primerApellido: datosFormulario.primerApellido.trim(),
        segundoApellido: datosFormulario.segundoApellido.trim(),
        nombreCompleto: `${datosFormulario.primerNombre} ${datosFormulario.primerApellido}`,
        ultimaVisita: serverTimestamp()
      };

      // B. Guardar o Actualizar Cliente en colección "clientes" (ID = Cédula)
      await setDoc(doc(db, "clientes", cedulaLimpia), datosCliente, { merge: true });

      // C. Actualizar la Habitación
      const habRef = doc(db, "habitaciones", habitacionId);
      await updateDoc(habRef, {
        estado: "Ocupada",
        huespedActual: {
          cedula: cedulaLimpia,
          nombre: datosCliente.nombreCompleto, // Nombre corto para mostrar en tarjeta
          personas: Number(datosFormulario.personas),
          fechaEntrada: new Date().toISOString(),
          precioPactado: Number(precioCobrado),
          estadoPago: "PAGADO", // Cobro adelantado
          consumos: [] 
        },
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Error en Check-in:", error);
      throw error;
    }
  };

  // 2. CHECK-OUT: Libera y marca como SUCIA
  const realizarCheckOut = async (habitacionId) => {
    try {
      const habRef = doc(db, "habitaciones", habitacionId);
      await updateDoc(habRef, {
        estado: "Sucia",
        huespedActual: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error Check-out:", error);
    }
  };

  // 3. CAMBIAR ESTADO (Limpieza, Mantenimiento, etc)
  const cambiarEstado = async (habitacionId, nuevoEstado) => {
    try {
      const habRef = doc(db, "habitaciones", habitacionId);
      await updateDoc(habRef, {
        estado: nuevoEstado,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  return { realizarCheckIn, realizarCheckOut, cambiarEstado };
};