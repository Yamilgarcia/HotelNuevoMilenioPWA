import { useEffect, useState } from "react";
import {
  createHabitacion,
  updateHabitacion,
} from "../data/habitaciones.supabase"; 
import { subscribeToHabitaciones } from "../data/habitaciones.subscriptions";

export const useHabitaciones = () => {
  const [habitaciones, setHabitaciones] = useState([]);

  useEffect(() => {
    // 1. CARGA INICIAL OFFLINE (Súper rápida)
    // Antes de esperar a que Supabase responda, mostramos lo que haya en la caché.
    const cachedData = localStorage.getItem('hotel_habitaciones_cache');
    if (cachedData) {
      setHabitaciones(JSON.parse(cachedData));
    }

    // 2. CONEXIÓN ONLINE Y ACTUALIZACIONES EN TIEMPO REAL
    // Cuando subscribeToHabitaciones obtenga datos (ya sea la primera carga o un cambio en vivo),
    // ejecutará este callback.
    const handleDataUpdate = (data) => {
      // Actualizamos la pantalla con los datos reales de Supabase
      setHabitaciones(data);
      // Guardamos silenciosamente una copia de seguridad en el baúl
      localStorage.setItem('hotel_habitaciones_cache', JSON.stringify(data));
    };

    // Intentamos suscribirnos a Supabase
    // Si no hay internet, esto simplemente fallará en silencio (gracias a los parches que pusimos antes),
    // pero la pantalla ya tendrá los datos de la caché local del paso 1.
    const unsubscribe = subscribeToHabitaciones(handleDataUpdate);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
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
    try {
       await updateHabitacion(id, { activo: !activoActual });
    } catch(error) {
       console.error("Error al cambiar estado activo:", error);
    }
  };

  return {
    habitaciones,
    handleSave,
    toggleEstadoActivo,
  };
};