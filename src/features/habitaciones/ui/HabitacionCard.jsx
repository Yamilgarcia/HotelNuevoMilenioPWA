import React from 'react';
import './HabitacionCard.css';
import BedIcon from '@mui/icons-material/Bed'; // Cama
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight'; // Flechita del footer
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'; // Icono para sucia

export const HabitacionCard = ({ hab, onClick }) => {
  
  // Definir clases y textos según estado
  let statusClass = 'room-free';
  let statusText = 'DISPONIBLE';
  
  if (!hab.activo) {
    statusClass = 'room-inactive';
    statusText = 'INACTIVA';
  } else if (hab.estado === 'Ocupada') {
    statusClass = 'room-occupied';
    statusText = 'OCUPADO';
  } else if (hab.estado === 'Sucia') {
    statusClass = 'room-dirty';
    statusText = 'LIMPIEZA';
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
        
        {/* Mostramos precio pequeño si está libre */}
        {hab.estado === 'Libre' && (
           <div className="room-price">C$ {hab.precio}</div>
        )}
      </div>

      {/* Barra Inferior Oscura: Estado */}
      <div className="room-footer">
        <span>{statusText}</span>
        {hab.estado === 'Sucia' ? <CleaningServicesIcon fontSize="small"/> : <ArrowCircleRightIcon fontSize="small" />}
      </div>
    </div>
  );
};