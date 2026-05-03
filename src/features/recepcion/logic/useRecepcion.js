import { supabase } from "../../../supabase.config"; 
import { useNavigate } from "react-router-dom";
import { addToSyncQueue } from "../../../utils/syncManager"; 

export const useRecepcion = () => {
  const navigate = useNavigate();

  // ==========================================
  // 1. CHECK-IN: Guarda Cliente y Ocupa Habitación
  
  const realizarCheckIn = async (habitacionId, datosFormulario, precioCobrado) => {
    
    if (!navigator.onLine) {
      addToSyncQueue('CHECK_IN', { habitacionId, datosFormulario, precioCobrado });
      alert("Estás offline 📶. El Check-in se guardó localmente y se enviará al servidor en cuanto regrese el internet.");
      return { offlineDataSaved: true }; 
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const recepcionistaId = session?.user?.id; 

      const cedulaLimpia = datosFormulario.cedula.trim().toUpperCase();
      
      // --- AÑADIMOS LUGAR Y FECHA DE NACIMIENTO AL PAYLOAD ---
      const datosCliente = {
        cedula: cedulaLimpia,
        primer_nombre: datosFormulario.primerNombre.trim(),
        segundo_nombre: datosFormulario.segundoNombre.trim(),
        primer_apellido: datosFormulario.primerApellido.trim(),
        segundo_apellido: datosFormulario.segundoApellido.trim(),
        nombre_completo: `${datosFormulario.primerNombre} ${datosFormulario.primerApellido}`,
        telefono: datosFormulario.telefono || null,
        lugar_nacimiento: datosFormulario.lugarNacimiento || null, // <-- NUEVO
        fecha_nacimiento: datosFormulario.fechaNacimiento || null, // <-- NUEVO
        ultima_visita: new Date().toISOString(),
        acepta_privacidad: datosFormulario.aceptaPrivacidad,
        fecha_aceptacion_privacidad: datosFormulario.aceptaPrivacidad ? new Date().toISOString() : null
      };

      const { error: clienteError } = await supabase.from('clientes').upsert(datosCliente);
      if (clienteError) throw clienteError;

      const huespedInfo = {
        cedula: cedulaLimpia,
        nombre: datosCliente.nombre_completo,
        personas: Number(datosFormulario.personas),
        fechaEntrada: datosFormulario.fechaEntrada,
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

      const { error: historialError } = await supabase.from('historial_hospedajes').insert([{
         cliente_cedula: cedulaLimpia,
         habitacion_id: habitacionId,
         fecha_entrada: datosFormulario.fechaEntrada,
         fecha_salida: datosFormulario.fechaSalida,
         personas: Number(datosFormulario.personas),
         total_pagar: Number(precioCobrado),
         estado_pago: "PAGADO",
         recepcionista_id: recepcionistaId 
      }]);

      if (historialError) {
          console.error("Error guardando el historial:", historialError);
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
  // 2. CHECK-OUT
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
  // 3. CAMBIAR ESTADO
  const cambiarEstado = async (habitacionId, nuevoEstado) => {
    if (!navigator.onLine) {
      addToSyncQueue('CAMBIAR_ESTADO', { habitacionId, nuevoEstado });
      alert(`Estás offline 📶. El estado a "${nuevoEstado}" se guardó localmente y se sincronizará al recuperar conexión.`);
      return { offlineDataSaved: true };
    }

    try {
      const { error } = await supabase
        .from('habitaciones')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', habitacionId);

      if (error) throw error;

    } catch (error) {
      console.error("Error cambiando estado:", error);

      if (error.offline || error.message === 'Failed to fetch' || error.status === 503) {
         addToSyncQueue('CAMBIAR_ESTADO', { habitacionId, nuevoEstado });
         alert(`Conexión fallida 📶. El cambio a "${nuevoEstado}" se guardó localmente para sincronizar luego.`);
         return { offlineDataSaved: true };
      }
      throw error; 
    }
  };

  return { realizarCheckIn, realizarCheckOut, cambiarEstado };
};