import { supabase } from "../../../supabase.config"; 

export const useRecepcion = () => {
  
  // 1. CHECK-IN: Guarda Cliente y Ocupa Habitación
  const realizarCheckIn = async (habitacionId, datosFormulario, precioCobrado) => {
    try {
      // A. Preparar datos del Cliente
      const cedulaLimpia = datosFormulario.cedula.trim().toUpperCase();
      
      const datosCliente = {
        cedula: cedulaLimpia,
        primer_nombre: datosFormulario.primerNombre.trim(),
        segundo_nombre: datosFormulario.segundoNombre.trim(),
        primer_apellido: datosFormulario.primerApellido.trim(),
        segundo_apellido: datosFormulario.segundoApellido.trim(),
        nombre_completo: `${datosFormulario.primerNombre} ${datosFormulario.primerApellido}`,
        ultima_visita: new Date().toISOString() // Supabase usa fechas estándar de JS
      };

      // B. Guardar o Actualizar Cliente en tabla "clientes" (upsert)
      const { error: clienteError } = await supabase
        .from('clientes')
        .upsert(datosCliente);

      if (clienteError) throw clienteError;

      // C. Actualizar la Habitación
      const { error: habError } = await supabase
        .from('habitaciones')
        .update({
          estado: "Ocupada",
          huesped_actual: {
            cedula: cedulaLimpia,
            nombre: datosCliente.nombre_completo, // Nombre corto para mostrar en tarjeta
            personas: Number(datosFormulario.personas),
            fechaEntrada: new Date().toISOString(),
            precioPactado: Number(precioCobrado),
            estadoPago: "PAGADO", // Cobro adelantado
            consumos: [] 
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', habitacionId); // ¡Muy importante el .eq() para saber cuál actualizar!

      if (habError) throw habError;

    } catch (error) {
      console.error("Error en Check-in:", error);
      throw error;
    }
  };

  // 2. CHECK-OUT: Libera y marca como SUCIA
  const realizarCheckOut = async (habitacionId) => {
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
    }
  };

  // 3. CAMBIAR ESTADO (Limpieza, Mantenimiento, etc)
  const cambiarEstado = async (habitacionId, nuevoEstado) => {
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
    }
  };

  return { realizarCheckIn, realizarCheckOut, cambiarEstado };
};