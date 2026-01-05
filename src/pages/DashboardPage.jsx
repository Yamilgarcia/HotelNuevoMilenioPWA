import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useHabitaciones } from '../features/habitaciones/logic/useHabitaciones';
import { HabitacionCard } from '../features/habitaciones/ui/HabitacionCard';
import '../features/habitaciones/ui/HabitacionCard.css'; // Importamos el grid

export default function DashboardPage() {
  const { habitaciones } = useHabitaciones();

  // Filtrar solo las habitaciones que no están inhabilitadas para la vista operativa
  const habitacionesVisibles = habitaciones.filter(h => h.activo !== false);

  const handleRoomClick = (hab) => {
    console.log("Gestionar habitación:", hab.numero);
    // Aquí es donde más adelante abriremos el check-in o check-out
  };

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
        Estado del Hotel
      </Typography>

      <div className="dashboard-grid">
        {habitacionesVisibles.length === 0 ? (
          <Typography color="white">No hay habitaciones registradas. Ve a "Registrar Hab" para comenzar.</Typography>
        ) : (
          habitacionesVisibles.map((hab) => (
            <HabitacionCard 
              key={hab.id} 
              hab={hab} 
              onClick={handleRoomClick} 
            />
          ))
        )}
      </div>

      {/* Leyenda de colores rápida */}
      <Box sx={{ mt: 5, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', bgcolor: 'rgba(255,255,255,0.8)', p: 2, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 15, height: 15, bgcolor: '#2ecc71', borderRadius: '50%' }} />
          <Typography variant="caption">Libre</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 15, height: 15, bgcolor: '#e74c3c', borderRadius: '50%' }} />
          <Typography variant="caption">Ocupada</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 15, height: 15, bgcolor: '#f39c12', borderRadius: '50%' }} />
          <Typography variant="caption">Sucia</Typography>
        </Box>
      </Box>
    </Box>
  );
}