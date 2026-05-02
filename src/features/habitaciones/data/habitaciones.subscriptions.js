import { supabase } from "../../../supabase.config";

export const subscribeToHabitaciones = (callback) => {
  // 1. Función para pedir todas las habitaciones ordenadas
  const fetchHabitaciones = async () => {
    const { data, error } = await supabase
      .from("habitaciones")
      .select("*")
      .order("numero");
      
    if (!error && data) {
      const ahora = new Date(); // <--- Capturamos la hora actual

      // --- AQUÍ OCURRE LA MAGIA DEL TIEMPO REBASADO ---
      const habitacionesEvaluadas = data.map((hab) => {
        let sePasoDelTiempo = false;

        // Validamos si la habitación está ocupada y si tiene datos del huésped
        if (hab.estado === "Ocupada" && hab.huesped_actual) {
          
          // Extraemos la fecha de salida del JSON. (Ajusta 'fechaSalida' si en tu JSON se llama distinto)
          const fechaSalidaString = hab.huesped_actual.fechaSalida || hab.huesped_actual.fecha_salida;

          if (fechaSalidaString) {
            const fechaSalidaObj = new Date(fechaSalidaString);
            
            // Si el reloj actual ya superó la hora de salida del cliente...
            if (ahora > fechaSalidaObj) {
              sePasoDelTiempo = true;
            }
          }
        }

        // Devolvemos la habitación inyectándole nuestra nueva propiedad
        return {
          ...hab,
          tiempoRebasado: sePasoDelTiempo
        };
      });

      // Le pasamos las habitaciones evaluadas al Hook (useHabitaciones)
      callback(habitacionesEvaluadas);
    }
  };

  // Pedimos los datos la primera vez que carga
  fetchHabitaciones();

  // 2. Nos suscribimos a CUALQUIER cambio en la tabla
  const channel = supabase
    .channel('cambios-habitaciones')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'habitaciones' },
      (payload) => {
        // Alguien hizo un cambio, volvemos a descargar y recalcular el tiempo de todas
        fetchHabitaciones();
      }
    )
    .subscribe();

  // 3. Retornamos la función de limpieza (unsubscribe) para el useEffect
  return () => {
    supabase.removeChannel(channel);
  };
};