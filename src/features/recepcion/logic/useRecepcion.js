import { supabase } from "../../../supabase.config"; 
import { useNavigate } from "react-router-dom";
// Ajusta la ruta dependiendo de dónde guardaste syncManager.js
import { addToSyncQueue } from "../../../utils/syncManager"; 

export const useRecepcion = () => {
  const navigate = useNavigate();

  // ==========================================
  // 1. CHECK-IN: Guarda Cliente y Ocupa Habitación
  // ==========================================
 // ==========================================
  // 1. CHECK-IN: Guarda Cliente y Ocupa Habitación
  // ==========================================
  const realizarCheckIn = async (habitacionId, datosFormulario, precioCobrado) => {
    
    if (!navigator.onLine) {
      addToSyncQueue('CHECK_IN', { habitacionId, datosFormulario, precioCobrado });
      alert("Estás offline 📶. El Check-in se guardó localmente y se enviará al servidor en cuanto regrese el internet.");
      return { offlineDataSaved: true }; 
    }

    try {
      // --- PASO 0: OBTENER EL USUARIO QUE ESTÁ LOGUEADO (La Recepcionista) ---
      // Obtenemos el ID del usuario actual de la sesión de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const recepcionistaId = session?.user?.id; // Si no hay sesión, será undefined

      // --- PASO 1: GUARDAR O ACTUALIZAR EL CLIENTE ---
      const cedulaLimpia = datosFormulario.cedula.trim().toUpperCase();
      
      const datosCliente = {
        cedula: cedulaLimpia,
        primer_nombre: datosFormulario.primerNombre.trim(),
        segundo_nombre: datosFormulario.segundoNombre.trim(),
        primer_apellido: datosFormulario.primerApellido.trim(),
        segundo_apellido: datosFormulario.segundoApellido.trim(),
        nombre_completo: `${datosFormulario.primerNombre} ${datosFormulario.primerApellido}`,
        telefono: datosFormulario.telefono || null,
        ultima_visita: new Date().toISOString(),
        acepta_privacidad: datosFormulario.aceptaPrivacidad,
        fecha_aceptacion_privacidad: datosFormulario.aceptaPrivacidad ? new Date().toISOString() : null
      };

      const { error: clienteError } = await supabase.from('clientes').upsert(datosCliente);
      if (clienteError) throw clienteError;

      // --- PASO 2: ACTUALIZAR LA HABITACIÓN COMO "OCUPADA" ---
      const huespedInfo = {
        cedula: cedulaLimpia,
        nombre: datosCliente.nombre_completo,
        personas: Number(datosFormulario.personas),
        fechaEntrada: datosFormulario.fechaEntrada, // Usamos la fecha del formulario, no la de 'now'
        fechaSalida: datosFormulario.fechaSalida,
        precioPactado: Number(precioCobrado),
        estadoPago: "PAGADO", 
        consumos: [] 
      };

      const { error: habError } = await supabase.from('habitaciones').update({
          estado: "Ocupada",
          huesped_actual: huespedInfo,
          updated_at: new Date().toISOString()
      }).eq('id', habitacionId); 

      if (habError) throw habError;

      // --- PASO 3: CREAR EL REGISTRO HISTÓRICO (La novedad) ---
      const { error: historialError } = await supabase.from('historial_hospedajes').insert([{
         cliente_cedula: cedulaLimpia,
         habitacion_id: habitacionId,
         fecha_entrada: datosFormulario.fechaEntrada,
         fecha_salida: datosFormulario.fechaSalida,
         personas: Number(datosFormulario.personas),
         total_pagar: Number(precioCobrado),
         estado_pago: "PAGADO",
         recepcionista_id: recepcionistaId // ¡Aquí queda grabada la huella de quién lo hizo!
      }]);

      if (historialError) {
          console.error("Error guardando el historial:", historialError);
          // Opcional: No lanzamos el error para no asustar al usuario si la reserva sí se hizo,
          // pero puedes agregar un alert aquí si lo consideras crítico.
      }

    } catch (error) {
      console.error("Error en Check-in:", error);

      if (error.offline || error.message === 'Failed to fetch' || error.status === 503) {
        addToSyncQueue('CHECK_IN', { habitacionId, datosFormulario, precioCobrado });
        alert("La conexión falló durante el envío 📶. El Check-in se guardó localmente para sincronizar más tarde.");
        return { offlineDataSaved: true };
      }

      if (error.code === '42501' || (error.message && error.message.includes('RLS'))) {
        navigate('/no-autorizado'); 
        throw error;
      }
      
      throw error;
    }
  };

  // ==========================================
  // 2. CHECK-OUT: Libera y marca como SUCIA
  // ==========================================
  const realizarCheckOut = async (habitacionId) => {
    
    if (!navigator.onLine) {
       addToSyncQueue('CHECK_OUT', { habitacionId });
       alert("Estás offline 📶. El Check-out se guardó localmente.");
       return { offlineDataSaved: true };
    }

    try {
      const { error } = await supabase
        .from('habitaciones')
        .update({
          estado: "Sucia",
          huesped_actual: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', habitacionId);

      if (error) throw error;

    } catch (error) {
      console.error("Error Check-out:", error);
      
      if (error.offline || error.message === 'Failed to fetch' || error.status === 503) {
        addToSyncQueue('CHECK_OUT', { habitacionId });
        alert("La conexión falló 📶. El Check-out se guardó localmente.");
        return { offlineDataSaved: true };
      }
    }
  };

  // ==========================================
  // 3. CAMBIAR ESTADO (Limpieza, Mantenimiento)
  // ==========================================
  // 3. CAMBIAR ESTADO (Limpieza, Mantenimiento, etc)
  const cambiarEstado = async (habitacionId, nuevoEstado) => {
    
    // 1. SI ESTAMOS OFFLINE: Guardamos en la cola y terminamos
    if (!navigator.onLine) {
      addToSyncQueue('CAMBIAR_ESTADO', { habitacionId, nuevoEstado });
      alert(`Estás offline 📶. El estado a "${nuevoEstado}" se guardó localmente y se sincronizará al recuperar conexión.`);
      return { offlineDataSaved: true };
    }

    // 2. SI ESTAMOS ONLINE: Intentamos la operación real
    try {
      const { error } = await supabase
        .from('habitaciones')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', habitacionId);

      if (error) throw error;
      
      // Opcional: Si quieres un feedback visual al cambiar estado online
      console.log(`Estado cambiado a ${nuevoEstado} exitosamente.`);

    } catch (error) {
      console.error("Error cambiando estado:", error);

      // 3. SI FALLÓ POR RED (INTERNET SE CAYÓ JUSTO EN EL MOMENTO)
      if (error.offline || error.message === 'Failed to fetch' || error.status === 503) {
         addToSyncQueue('CAMBIAR_ESTADO', { habitacionId, nuevoEstado });
         alert(`Conexión fallida 📶. El cambio a "${nuevoEstado}" se guardó localmente para sincronizar luego.`);
         return { offlineDataSaved: true };
      }
      
      throw error; // Si es un error de otra naturaleza, lo lanzamos
    }
  };

  return { realizarCheckIn, realizarCheckOut, cambiarEstado };
};