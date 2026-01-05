import React from 'react';
import './HabitacionCard.css';
import TvIcon from '@mui/icons-material/Tv';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import BathtubIcon from '@mui/icons-material/Bathtub';
import BedIcon from '@mui/icons-material/Bed';

export const HabitacionCard = ({ hab, onClick }) => {
  
  // Lógica para mostrar iconos según las amenidades guardadas
  const renderIcons = () => {
    const text = hab.amenidades?.toLowerCase() || "";
    return (
      <div className="room-icons">
        <BedIcon fontSize="small" />
        {text.includes("televisor") && <TvIcon fontSize="small" />}
        {text.includes("baño") && <BathtubIcon fontSize="small" />}
        {text.includes("ac") && <AcUnitIcon fontSize="small" />}
      </div>
    );
  };

  const getStatusClass = () => {
    if (!hab.activo) return 'room-inactive';
    switch (hab.estado) {
      case 'Ocupada': return 'room-occupied';
      case 'Sucia': return 'room-dirty';
      default: return 'room-free';
    }
  };

  return (
    <div className={`room-card ${getStatusClass()}`} onClick={() => onClick(hab)}>
      <div className="room-header">
        <p className="room-number">#{hab.numero}</p>
        <div className="status-dot" style={{ 
          backgroundColor: hab.estado === 'Libre' ? '#2ecc71' : hab.estado === 'Ocupada' ? '#e74c3c' : '#f39c12',
          color: hab.estado === 'Libre' ? '#2ecc71' : hab.estado === 'Ocupada' ? '#e74c3c' : '#f39c12'
        }}></div>
      </div>

      <div className="room-info">
        <p className="room-type">{hab.categoria}</p>
        <span className="room-price">C$ {hab.precio}</span>
        {renderIcons()}
      </div>
    </div>
  );
};