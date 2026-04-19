import { supabase } from "../../../supabase.config"; 
import { useNavigate } from "react-router-dom";
// Ajusta la ruta dependiendo de dónde guardaste syncManager.js
import { addToSyncQueue } from "../../../utils/syncManager"; 

export const useRecepcion = () => {
  const navigate = useNavigate();

  // ==========================================
  // 1. CHECK-IN: Guarda Cliente y Ocupa Habitación
  // ==========================================
  const realizarCheckIn = async (habitacionId, datosFormulario, precioCobrado) => {
    
    // CASO A: El navegador sabe de antemano que NO hay internet
    if (!navigator.onLine) {
      addToSyncQueue('CHECK_IN', { habitacionId, datosFormulario, precioCobrado });
      alert("Estás offline 📶. El Check-in se guardó localmente y se enviará al servidor en cuanto regrese el internet.");
      return { offlineDataSaved: true }; 
    }

    try {
      const cedulaLimpia = datosFormulario.cedula.trim().toUpperCase();
      
      const datosCliente = {
        cedula: cedulaLimpia,
        primer_nombre: datosFormulario.primerNombre.trim(),
        segundo_nombre: datosFormulario.segundoNombre.trim(),
        primer_apellido: datosFormulario.primerApellido.trim(),
        segundo_apellido: datosFormulario.segundoApellido.trim(),
        nombre_completo: `${datosFormulario.primerNombre} ${datosFormulario.primerApellido}`,
        ultima_visita: new Date().toISOString() 
      };

      const { error: clienteError } = await supabase.from('clientes').upsert(datosCliente);
      if (clienteError) throw clienteError;

      const { error: habError } = await supabase.from('habitaciones').update({
          estado: "Ocupada",
          huesped_actual: {
            cedula: cedulaLimpia,
            nombre: datosCliente.nombre_completo,
            personas: Number(datosFormulario.personas),
            fechaEntrada: new Date().toISOString(),
            precioPactado: Number(precioCobrado),
            estadoPago: "PAGADO", 
            consumos: [] 
          },
          updated_at: new Date().toISOString()
        }).eq('id', habitacionId); 

      if (habError) throw habError;

    } catch (error) {
      console.error("Error en Check-in:", error);

      // CASO B: El navegador creía tener internet, pero falló en el camino (Service Worker 503 o caída repentina)
      if (error.offline || error.message === 'Failed to fetch' || error.status === 503) {
        addToSyncQueue('CHECK_IN', { habitacionId, datosFormulario, precioCobrado });
        alert("La conexión falló durante el envío 📶. El Check-in se guardó localmente para sincronizar más tarde.");
        return { offlineDataSaved: true };
      }

      // CASO C: Error de RLS (Supabase te bloquea por reglas de seguridad)
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