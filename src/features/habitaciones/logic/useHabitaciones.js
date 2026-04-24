import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createHabitacion,
  updateHabitacion,
} from "../data/habitaciones.supabase"; 
import { subscribeToHabitaciones } from "../data/habitaciones.subscriptions";
// Importamos tu sistema de notificaciones bonitas
import { useToast } from "../../../components/ToastContext"; 

export const useHabitaciones = () => {
  const [habitaciones, setHabitaciones] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast(); // Inicializamos las alertas

  useEffect(() => {
    const cachedData = localStorage.getItem('hotel_habitaciones_cache');
    if (cachedData) {
      setHabitaciones(JSON.parse(cachedData));
    }

    const handleDataUpdate = (data) => {
      setHabitaciones(data);
      localStorage.setItem('hotel_habitaciones_cache', JSON.stringify(data));
    };

    const unsubscribe = subscribeToHabitaciones(handleDataUpdate);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSave = async (data, habitacionId) => {
    try {
      const idAEditar = habitacionId || data.id;

      // Esperamos a que Supabase confirme la acción
      if (idAEditar) {
        await updateHabitacion(idAEditar, data);
        showToast(" Habitación actualizada correctamente", "success"); // Alerta bonita de éxito
      } else {
        await createHabitacion(data);
        showToast(" Habitación registrada exitosamente", "success"); // Alerta bonita de éxito
      }

      navigate("/configuracion/habitaciones");

    } catch (error) {
      console.error("Error al guardar habitación:", error);
      // Reemplazamos el feo alert() por tu diseño
      showToast("❌ Hubo un error al guardar los datos", "error"); 
    }
  };

  const toggleEstadoActivo = async (id, activoActual) => {
    try {
       await updateHabitacion(id, { activo: !activoActual });
       showToast(`✅ Habitación ${!activoActual ? 'activada' : 'desactivada'}`, "success");
    } catch(error) {
       console.error("Error al cambiar estado activo:", error);
       showToast("❌ Error al cambiar el estado", "error");
    }
  };

  return {
    habitaciones,
    handleSave,
    toggleEstadoActivo,
  };
};