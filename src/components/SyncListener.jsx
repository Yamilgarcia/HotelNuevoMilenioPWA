// src/components/SyncListener.jsx
import { useEffect } from 'react';
import { getSyncQueue, removeFromSyncQueue } from '../utils/syncManager';
import { useRecepcion } from '../features/recepcion/logic/useRecepcion';

export default function SyncListener() {
  // Extraemos las 3 funciones de nuestro hook
  const { realizarCheckIn, realizarCheckOut, cambiarEstado } = useRecepcion();

  useEffect(() => {
    const procesarCola = async () => {
      const queue = getSyncQueue();
      if (queue.length === 0) return;

      console.log(`Iniciando sincronización: ${queue.length} tareas pendientes.`);

      for (const tarea of queue) {
        try {
          // 1. CHECK_IN
          if (tarea.accion === 'CHECK_IN') {
            await realizarCheckIn(
              tarea.payload.habitacionId, 
              tarea.payload.datosFormulario, 
              tarea.payload.precioCobrado
            );
            removeFromSyncQueue(tarea.id);
            console.log(`✅ Tarea ${tarea.id} (CHECK_IN) sincronizada.`);
          } 
          // 2. CAMBIAR_ESTADO
          else if (tarea.accion === 'CAMBIAR_ESTADO') {
            await cambiarEstado(tarea.payload.habitacionId, tarea.payload.nuevoEstado);
            removeFromSyncQueue(tarea.id);
            console.log(`✅ Tarea ${tarea.id} (CAMBIAR_ESTADO) sincronizada.`);
          }
          // 3. CHECK_OUT
          else if (tarea.accion === 'CHECK_OUT') {
            await realizarCheckOut(tarea.payload.habitacionId);
            removeFromSyncQueue(tarea.id);
            console.log(`✅ Tarea ${tarea.id} (CHECK_OUT) sincronizada.`);
          }
          
        } catch (error) {
          console.error(`❌ Falló la sincronización de la tarea ${tarea.id}`, error);
          // Si falla, el bucle continúa con la siguiente tarea, dejando esta en la cola
        }
      }
      
      if (getSyncQueue().length === 0) {
        console.log("Sincronización completa. Todos los datos están en el servidor.");
      }
    };

    // Escuchamos cuando el navegador recupera internet
    window.addEventListener('online', procesarCola);

    // Intentamos procesar apenas carga la app si ya hay internet
    if (navigator.onLine) {
      procesarCola();
    }

    return () => {
      window.removeEventListener('online', procesarCola);
    };
  }, [realizarCheckIn, realizarCheckOut, cambiarEstado]); 

  return null; 
}