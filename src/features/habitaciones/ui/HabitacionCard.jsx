import React from 'react';
import './HabitacionCard.css';
import BedIcon from '@mui/icons-material/Bed';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import WarningIcon from '@mui/icons-material/Warning';

export const HabitacionCard = ({ hab, onClick }) => {
  
  let statusClass = 'room-free';
  let statusText = 'DISPONIBLE';
  let IconoFooter = ArrowCircleRightIcon;
  
  // Evaluamos si el tiempo se rebasó (Ajusta la validación según cómo venga de tu BD)
  const isVencida = hab.estado === 'Vencida' || hab.tiempoRebasado === true;

  if (!hab.activo) {
    statusClass = 'room-inactive';
    statusText = 'INACTIVA';
  } else if (isVencida) {
    statusClass = 'room-overdue'; // NUEVO ESTADO: ROJO
    statusText = 'RETRASADA';
    IconoFooter = WarningIcon;
  } else if (hab.estado === 'Ocupada') {
    statusClass = 'room-occupied'; // NARANJA
    statusText = 'OCUPADA';
  } else if (hab.estado === 'Sucia') {
    statusClass = 'room-dirty'; // AZUL CIELO
    statusText = 'EN LIMPIEZA';
    IconoFooter = CleaningServicesIcon;
  } else if (hab.estado === 'Mantenimiento') {
    statusClass = 'room-maintenance'; // GRIS
    statusText = 'MANTENIMIENTO';
  }

  return (
    <div className={`room-card ${statusClass}`} onClick={() => onClick(hab)}>
      
      {/* Parte Superior: Datos */}
      <div className="room-content">
        <div className="room-header-row">
          <h1 className="room-number">Nro:{hab.numero}</h1>
          <BedIcon className="room-icon-large" />
        </div>
        
        <div className="room-type">
          {hab.categoria || hab.tipo}
        </div>
        
        {/* Solo mostramos precio si está libre */}
        {hab.estado === 'Libre' && (
           <div className="room-price">C$ {hab.precio}</div>
        )}
      </div>

      {/* Barra Inferior: Estado */}
      <div className="room-footer">
        <span>{statusText}</span>
        <IconoFooter fontSize="small" />
      </div>
    </div>
  );
};