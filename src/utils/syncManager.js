// src/utils/syncManager.js

const SYNC_KEY = "hotel_sync_queue";

// Obtener todas las tareas pendientes
export const getSyncQueue = () => {
  const queue = localStorage.getItem(SYNC_KEY);
  return queue ? JSON.parse(queue) : [];
};

// Agregar una nueva tarea a la cola
export const addToSyncQueue = (accion, payload) => {
  const queue = getSyncQueue();
  const newTask = {
    id: Date.now(), // ID único basado en el tiempo
    accion,         // Ej: 'CHECK_IN', 'NUEVA_HABITACION'
    payload,        // Los datos del formulario
    fecha: new Date().toISOString()
  };
  queue.push(newTask);
  localStorage.setItem(SYNC_KEY, JSON.stringify(queue));
};

// Eliminar una tarea que ya se sincronizó con éxito
export const removeFromSyncQueue = (taskId) => {
  let queue = getSyncQueue();
  queue = queue.filter(task => task.id !== taskId);
  localStorage.setItem(SYNC_KEY, JSON.stringify(queue));
};