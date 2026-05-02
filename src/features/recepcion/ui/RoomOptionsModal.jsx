import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Box, Typography, Grid, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Iconos
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// --- COMPONENTE AUXILIAR ---
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
        gap: 1,
        textAlign: 'center'
      }}
    >
      {icon}
      <Typography variant="button" sx={{ fontWeight: 'bold', fontSize: '0.75rem', lineHeight: 1.2 }}>
        {label}
      </Typography>
    </Button>
  </Grid>
);

export default function RoomOptionsModal({ open, onClose, habitacion, onAction }) {
  if (!habitacion) return null;

  // Verificamos si la habitación rebasó su tiempo (puede venir como estado 'Vencida' o un flag)
  const isVencida = habitacion.estado === 'Vencida' || habitacion.tiempoRebasado === true;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', color: 'white' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Habitación {habitacion.numero}</Typography>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.8 }}>
            Estado: {isVencida ? 'TIEMPO REBASADO' : habitacion.estado}
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
              <ActionButton icon={<CleaningServicesIcon fontSize="large"/>} label="SOLICITAR LIMPIEZA" color="#38bdf8" onClick={() => onAction('MARK_DIRTY', habitacion)} />
              <ActionButton icon={<BuildIcon fontSize="large"/>} label="MANTENIMIENTO" color="#7f8c8d" onClick={() => onAction('MARK_MAINTENANCE', habitacion)} />
            </>
          )}

          {/* --- CASO 2: OCUPADA (NARANJA) --- */}
          {habitacion.estado === 'Ocupada' && !isVencida && (
            <>
              <ActionButton icon={<AttachMoneyIcon fontSize="large"/>} label="SALIDA / CHECK-OUT" color="#f39c12" onClick={() => onAction('CHECKOUT', habitacion)} />
              <ActionButton icon={<CleaningServicesIcon fontSize="large"/>} label="LIMPIEZA INTERMEDIA" color="#38bdf8" onClick={() => onAction('INTERMEDIATE_CLEANING', habitacion)} />
            </>
          )}

          {/* --- CASO 3: TIEMPO REBASADO (ROJO) --- */}
          {isVencida && (
            <>
              <ActionButton icon={<AttachMoneyIcon fontSize="large"/>} label="COBRAR SALIDA RETRASADA" color="#e62222" onClick={() => onAction('CHECKOUT', habitacion)} />
              <ActionButton icon={<WarningAmberIcon fontSize="large"/>} label="MULTA / RECARGO" color="#c0392b" onClick={() => onAction('PENALTY', habitacion)} />
            </>
          )}

          {/* --- CASO 4: LIMPIEZA / SUCIA (AZUL CIELO) --- */}
          {habitacion.estado === 'Sucia' && (
            <>
              <ActionButton icon={<CheckCircleIcon fontSize="large"/>} label="TERMINAR LIMPIEZA" color="#008f39" onClick={() => onAction('FINISH_CLEANING', habitacion)} />
              <ActionButton icon={<ReportProblemIcon fontSize="large"/>} label="REPORTAR DAÑO" color="#e62222" onClick={() => onAction('REPORT_DAMAGE', habitacion)} />
              <ActionButton icon={<BuildIcon fontSize="large"/>} label="MANTENIMIENTO" color="#7f8c8d" onClick={() => onAction('MARK_MAINTENANCE', habitacion)} />
            </>
          )}

           {/* --- CASO 5: MANTENIMIENTO (GRIS) --- */}
           {habitacion.estado === 'Mantenimiento' && (
            <ActionButton icon={<CheckCircleIcon fontSize="large"/>} label="HABILITAR HABITACIÓN" color="#008f39" onClick={() => onAction('FINISH_CLEANING', habitacion)} />
          )}

        </Grid>
      </DialogContent>
    </Dialog>
  );
} 