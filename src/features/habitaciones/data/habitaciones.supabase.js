import { supabase } from "../../../supabase.config"; // Asegúrate de que la ruta sea correcta

export const createHabitacion = async (habitacion) => {
  // .insert() recibe un arreglo de objetos
  const { data, error } = await supabase
    .from("habitaciones")
    .insert([{
      ...habitacion,
      activo: true,
      estado: "Libre"
      // created_at y updated_at se generan solos en la base de datos gracias al SQL
    }])
    .select(); // .select() devuelve el objeto recién creado

  if (error) throw error;
  return data;
};

export const updateHabitacion = async (id, data) => {
  const { error } = await supabase
    .from("habitaciones")
    .update({
      ...data,
      updated_at: new Date().toISOString(), // Forzamos la actualización de la fecha
    })
    .eq("id", id); // Es vital el .eq() para decirle QUÉ fila actualizar

  if (error) throw error;
};