import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';

import './CedulaScanner.css'; // Crearemos este archivo CSS abajo

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);

  useEffect(() => {
    // 1. Instanciar el lector NÚCLEO (sin interfaz fea)
    const html5QrCodeInstance = new Html5Qrcode("reader");
    setHtml5QrCode(html5QrCodeInstance);

    const startScanner = async () => {
      try {
        // 2. Buscar cámaras traseras
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          // Intentamos encontrar la cámara trasera "environment"
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')) || devices[devices.length - 1];
          const cameraId = backCamera.id;

          // 3. Iniciar escaneo con configuración ULTRA (HD)
          await html5QrCodeInstance.start(
            cameraId,
            {
              fps: 15, // Más rápido
              qrbox: { width: 300, height: 180 }, // Rectangular, ajustado a la forma del código PDF417
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                focusMode: "continuous", // Enfoque continuo
                height: { min: 720, ideal: 1080 }, // Forzar HD
                facingMode: "environment"
              }
            },
            (decodedText) => {
              // Éxito
              if (decodedText.length > 20) { // Ignorar códigos cortos
                 html5QrCodeInstance.stop().then(() => {
                    onScanSuccess(decodedText);
                 }).catch(err => console.error(err));
              }
            },
            (errorMessage) => {
              // Ignorar errores de frame vacío
            }
          );
          setLoading(false);
        } else {
          alert("No se encontraron cámaras.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error al iniciar cámara:", err);
        setLoading(false);
      }
    };

    startScanner();

    // Limpieza al salir
    return () => {
      if (html5QrCodeInstance.isScanning) {
        html5QrCodeInstance.stop().catch(err => console.error("Error al detener", err));
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para linterna (si el navegador lo soporta)
  const toggleFlash = () => {
     if (html5QrCode) {
        html5QrCode.applyVideoConstraints({
           advanced: [{ torch: !torchOn }]
        }).then(() => setTorchOn(!torchOn)).catch(e => console.log("Linterna no soportada", e));
     }
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '400px', 
      bgcolor: 'black', 
      overflow: 'hidden',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      
      {/* El video se inyecta aquí */}
      <div id="reader" style={{ width: '100%', height: '100%' }}></div>

      {/* --- CAPA DE INTERFAZ PERSONALIZADA --- */}
      
      {/* 1. Cargando */}
      {loading && (
        <Box sx={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
           <CircularProgress color="success" />
           <Typography variant="body2" color="white">Iniciando Cámara HD...</Typography>
        </Box>
      )}

      {/* 2. Marco de Escaneo (Overlay) */}
      {!loading && (
        <div className="scanner-overlay">
           <div className="scanner-box">
              <div className="scanner-line"></div>
           </div>
           <Typography variant="subtitle2" className="scanner-text">
              Enfoca el código denso trasero
           </Typography>
        </div>
      )}

      {/* 3. Botones de Control */}
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 20, display: 'flex', gap: 1 }}>
         <IconButton onClick={toggleFlash} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
            {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
         </IconButton>
         <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,0,0,0.7)' }}>
            <CloseIcon />
         </IconButton>
      </Box>

    </Box>
  );
}