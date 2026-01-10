import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Box, Typography, Grid, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Iconos
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

// --- COMPONENTE AUXILIAR (DEFINIDO AFUERA PARA EVITAR ERRORES) ---
const ActionButton = ({ icon, label, color, onClick }) => (
  <Grid item xs={6}>
    <Button
      variant="contained"
      fullWidth
      onClick={onClick}
      sx={{
        height: 100,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: color,
        '&:hover': { filter: 'brightness(0.9)', bgcolor: color },
        gap: 1
      }}
    >
      {icon}
      <Typography variant="button" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{label}</Typography>
    </Button>
  </Grid>
);

export default function RoomOptionsModal({ open, onClose, habitacion, onAction }) {
  if (!habitacion) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', color: 'white' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Habitación {habitacion.numero}</Typography>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.8 }}>
            Estado: {habitacion.estado}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2, p: 2 }}>
        <Grid container spacing={2}>
          
          {/* --- CASO 1: LIBRE (VERDE) --- */}
          {habitacion.estado === 'Libre' && (
            <>
              <ActionButton icon={<PersonAddIcon fontSize="large"/>} label="HOSPEDAR" color="#008f39" onClick={() => onAction('CHECKIN', habitacion)} />
              <ActionButton icon={<CleaningServicesIcon fontSize="large"/>} label="MARCAR SUCIA" color="#f39c12" onClick={() => onAction('MARK_DIRTY', habitacion)} />
              <ActionButton icon={<BuildIcon fontSize="large"/>} label="MANTENIMIENTO" color="#7f8c8d" onClick={() => onAction('MARK_MAINTENANCE', habitacion)} />
            </>
          )}

          {/* --- CASO 2: OCUPADA (ROJO) --- */}
          {habitacion.estado === 'Ocupada' && (
            <>
              <ActionButton icon={<AttachMoneyIcon fontSize="large"/>} label="SALIDA / CHECK-OUT" color="#cb3234" onClick={() => onAction('CHECKOUT', habitacion)} />
              <ActionButton icon={<AddShoppingCartIcon fontSize="large"/>} label="AGREGAR CONSUMO" color="#3498db" onClick={() => onAction('ADD_CONSUMPTION', habitacion)} />
              <ActionButton icon={<EventRepeatIcon fontSize="large"/>} label="EXTENDER ESTADÍA" color="#9b59b6" onClick={() => onAction('EXTEND', habitacion)} />
              <ActionButton icon={<InfoIcon fontSize="large"/>} label="VER DETALLE" color="#34495e" onClick={() => onAction('DETAILS', habitacion)} />
              <ActionButton icon={<BuildIcon fontSize="large"/>} label="CAMBIO HABITACIÓN" color="#7f8c8d" onClick={() => onAction('CHANGE_ROOM', habitacion)} />
            </>
          )}

          {/* --- CASO 3: SUCIA (NARANJA) --- */}
          {habitacion.estado === 'Sucia' && (
            <>
              <ActionButton icon={<CheckCircleIcon fontSize="large"/>} label="TERMINAR LIMPIEZA" color="#008f39" onClick={() => onAction('FINISH_CLEANING', habitacion)} />
              <ActionButton icon={<ReportProblemIcon fontSize="large"/>} label="REPORTAR DAÑO" color="#e67e22" onClick={() => onAction('REPORT_DAMAGE', habitacion)} />
              <ActionButton icon={<BuildIcon fontSize="large"/>} label="MANTENIMIENTO" color="#7f8c8d" onClick={() => onAction('MARK_MAINTENANCE', habitacion)} />
            </>
          )}

           {/* --- CASO 4: MANTENIMIENTO (GRIS) --- */}
           {habitacion.estado === 'Mantenimiento' && (
            <ActionButton icon={<CheckCircleIcon fontSize="large"/>} label="HABILITAR" color="#008f39" onClick={() => onAction('FINISH_CLEANING', habitacion)} />
          )}

        </Grid>
      </DialogContent>
    </Dialog>
  );
}