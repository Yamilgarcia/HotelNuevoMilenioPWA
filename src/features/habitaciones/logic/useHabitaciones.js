import { useEffect, useState } from "react";
import {
  createHabitacion,
  updateHabitacion,
} from "../data/habitaciones.firebase";
import { subscribeToHabitaciones } from "../data/habitaciones.subscriptions";

export const useHabitaciones = () => {
  const [habitaciones, setHabitaciones] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToHabitaciones(setHabitaciones);
    return () => unsubscribe();
  }, []);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await updateHabitacion(data.id, data);
      } else {
        await createHabitacion(data);
      }
    } catch (error) {
      console.error("Error al guardar habitación:", error);
    }
  };

  const toggleEstadoActivo = async (id, activoActual) => {
    await updateHabitacion(id, { activo: !activoActual });
  };

  return {
    habitaciones,
    handleSave,
    toggleEstadoActivo,
  };
};
