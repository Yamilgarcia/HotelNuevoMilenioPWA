import React, { useState } from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useHabitaciones } from '../features/habitaciones/logic/useHabitaciones';
import { useRecepcion } from '../features/recepcion/logic/useRecepcion'; 
import { HabitacionCard } from '../features/habitaciones/ui/HabitacionCard';
import '../features/habitaciones/ui/HabitacionCard.css';

// Importamos los Modales
import CheckInModal from '../features/recepcion/ui/CheckInModal';
import RoomOptionsModal from '../features/recepcion/ui/RoomOptionsModal';

export default function DashboardPage() {
  const { habitaciones } = useHabitaciones();
  const { realizarCheckIn, realizarCheckOut, cambiarEstado } = useRecepcion();
  
  const [busqueda, setBusqueda] = useState("");
  
  // Estados para controlar los modales
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false); // Modal de Botones (Opciones)
  const [checkInOpen, setCheckInOpen] = useState(false); // Modal de Formulario (Check-in)

  // Filtro del buscador
  const habitacionesFiltradas = habitaciones.filter(hab => {
    if (hab.activo === false) return false;
    const texto = busqueda.toLowerCase();
    return hab.numero.toString().includes(texto) || hab.categoria?.toLowerCase().includes(texto);
  });

  // 1. Al dar click en una tarjeta, ABRIMOS EL MENÚ DE OPCIONES
  const handleRoomClick = (hab) => {
    setSelectedRoom(hab);
    setOptionsOpen(true); 
  };

  // 2. Manejador de las acciones del Menú de Opciones
  const handleAction = async (actionKey, habitacion) => {
    setOptionsOpen(false); // Cerramos el menú de botones primero

    switch (actionKey) {
      case 'CHECKIN':
        setCheckInOpen(true); // Abrimos formulario de ingreso
        break;
      
      case 'CHECKOUT':
        // IMPORTANTE: Aquí cambiaremos esto pronto por un Modal de Salida real
        if(window.confirm(`¿Confirmar salida de la habitación ${habitacion.numero}? Se marcará como SUCIA.`)) {
            await realizarCheckOut(habitacion.id);
        }
        break;

      case 'MARK_DIRTY':
        await cambiarEstado(habitacion.id, 'Sucia');
        break;

      case 'FINISH_CLEANING':
        await cambiarEstado(habitacion.id, 'Libre');
        break;

      case 'MARK_MAINTENANCE':
        await cambiarEstado(habitacion.id, 'Mantenimiento');
        break;

      case 'ADD_CONSUMPTION':
        alert("Próximamente: Módulo de Tiendita/Consumo");
        break;
        
      default:
        console.log("Acción no implementada:", actionKey);
    }
  };

  // 3. Confirmar Check-in desde el modal
  const handleConfirmCheckIn = async (habitacionId, datos, precio) => {
    await realizarCheckIn(habitacionId, datos, precio);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#1e293b', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Panel de Recepción</Typography>
        <TextField
          placeholder="Buscar..."
          size="small"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ bgcolor: '#334155', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }}/></InputAdornment> }}
        />
      </Box>

      <div className="dashboard-grid">
        {habitacionesFiltradas.map((hab) => (
            <HabitacionCard key={hab.id} hab={hab} onClick={handleRoomClick} />
        ))}
      </div>

      {/* MODAL PRINCIPAL DE OPCIONES (Botones grandes) */}
      <RoomOptionsModal 
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        habitacion={selectedRoom}
        onAction={handleAction}
      />

      {/* MODAL SECUNDARIO (Formulario Check-in) */}
      <CheckInModal 
        open={checkInOpen} 
        onClose={() => setCheckInOpen(false)} 
        habitacion={selectedRoom}
        onConfirm={handleConfirmCheckIn}
      />
    </Box>
  );
}   