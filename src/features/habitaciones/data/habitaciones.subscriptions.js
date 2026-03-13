import { supabase } from "../../../supabase.config";

export const subscribeToHabitaciones = (callback) => {
  // 1. Función para pedir todas las habitaciones ordenadas
  const fetchHabitaciones = async () => {
    const { data, error } = await supabase
      .from("habitaciones")
      .select("*")
      .order("numero");
      
    if (!error && data) {
      callback(data);
    }
  };

  // Pedimos los datos la primera vez que carga
  fetchHabitaciones();

  // 2. Nos suscribimos a CUALQUIER cambio (INSERT, UPDATE, DELETE) en la tabla
  const channel = supabase
    .channel('cambios-habitaciones')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'habitaciones' },
      (payload) => {
        // Si alguien inserta, actualiza o borra una habitación, volvemos a traer la lista
        fetchHabitaciones();
      }
    )
    .subscribe();

  // 3. Retornamos la función de limpieza (unsubscribe) para el useEffect
  return () => {
    supabase.removeChannel(channel);
  };
};