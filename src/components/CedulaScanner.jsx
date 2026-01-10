import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, IconButton, Slider, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

import './CedulaScanner.css';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [capabilities, setCapabilities] = useState({}); // Para saber si soporta zoom/flash

  // INICIALIZACIÓN
  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    setHtml5QrCode(scanner);

    const init = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          // Filtramos solo las traseras
          const backCameras = devices.filter(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment')
          );
          
          // Si no encuentra etiquetas "back", usamos todas (fallback)
          const camerasToUse = backCameras.length > 0 ? backCameras : devices;
          setCameras(camerasToUse);
          
          // Iniciamos con la primera cámara encontrada
          startCamera(scanner, camerasToUse[0].id);
        } else {
          alert("No se detectaron cámaras.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error inicializando:", err);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(e => console.error(e));
      }
    };
  }, []);

  // FUNCIÓN PARA INICIAR CÁMARA
  const startCamera = async (scanner, cameraId) => {
    setLoading(true);
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 300, height: 180 }, // Rectangular para PDF417
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            focusMode: "continuous", // CRÍTICO para S21 Ultra
            height: { min: 720, ideal: 1080 } // Forzar HD
          }
        },
        (decodedText) => {
          if (decodedText.length > 15) { // Filtro de basura
             scanner.stop().then(() => onScanSuccess(decodedText));
          }
        },
        () => {} // Ignorar errores de frame
      );

      // OBTENER CAPACIDADES (Para saber si tiene Zoom y Flash)
      const videoTrack = scanner.getRunningTrackCameraCapabilities();
      // Ojo: getRunningTrackCameraCapabilities devuelve el objeto nativo MediaTrackCapabilities
      // pero html5-qrcode a veces lo envuelve. Intentamos acceder directo.
      
      // Truco: Acceder al track nativo para leer capacidades reales
      const track = scanner.html5QrCodeScanner?.videoElement?.srcObject?.getVideoTracks()[0] 
                    || scanner.canvasElement?.srcObject?.getVideoTracks()[0]; // Fallback

      setCapabilities(videoTrack || {});
      setLoading(false);

    } catch (err) {
      console.error("Error al iniciar cámara:", err);
      setLoading(false);
      alert("No se pudo iniciar esta cámara. Intenta cambiarla.");
    }
  };

  // CAMBIAR CÁMARA (Ciclar entre lentes)
  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    startCamera(html5QrCode, cameras[nextIndex].id);
  };

  // LINTERNA
  const toggleFlash = async () => {
    if (!html5QrCode) return;
    try {
      await html5QrCode.applyVideoConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error(err);
      alert("Esta cámara no soporta linterna o está en uso.");
    }
  };

  // ZOOM (Vital para S21 Ultra)
  const handleZoomChange = async (event, newValue) => {
    setZoom(newValue);
    if (!html5QrCode) return;
    try {
      await html5QrCode.applyVideoConstraints({
        advanced: [{ zoom: newValue }]
      });
    } catch (err) {
      console.error("Zoom no soportado", err);
    }
  };

  return (
    <Box sx={{ 
      position: 'relative', width: '100%', height: '500px', bgcolor: 'black', 
      borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      
      {/* AREA DE VIDEO */}
      <div id="reader" style={{ flex: 1, width: '100%', height: '100%', objectFit: 'cover' }}></div>

      {/* INTERFAZ OVERLAY */}
      {!loading && (
        <>
          {/* MARCO LÁSER */}
          <div className="scanner-overlay">
             <div className="scanner-box">
                <div className="scanner-line"></div>
             </div>
             <Typography variant="caption" className="scanner-text">
                Enfoca el código PDF417
             </Typography>
          </div>

          {/* CONTROLES SUPERIORES (Flash y Cerrar) */}
          <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 20, display: 'flex', gap: 1 }}>
             <IconButton onClick={toggleFlash} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
             </IconButton>
             <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,50,50,0.8)' }}>
                <CloseIcon />
             </IconButton>
          </Box>

          {/* CONTROLES INFERIORES (Zoom y Cambio de Cámara) */}
          <Box sx={{ 
            position: 'absolute', bottom: 0, left: 0, width: '100%', 
            p: 2, zIndex: 20, 
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex', flexDirection: 'column', gap: 1
          }}>
            
            {/* SLIDER DE ZOOM */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2 }}>
               <ZoomInIcon sx={{ color: 'white', opacity: 0.7 }} fontSize="small" />
               <Slider 
                  value={zoom} 
                  min={1} 
                  max={5} // Zoom hasta 5x
                  step={0.1}
                  onChange={handleZoomChange}
                  sx={{ color: '#2ecc71' }} 
               />
               <Typography color="white" variant="caption">{zoom}x</Typography>
            </Box>

            {/* BOTÓN CAMBIO DE CÁMARA (Solo si hay más de una) */}
            {cameras.length > 1 && (
               <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    onClick={switchCamera} 
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, px: 3 }}
                  >
                     <CameraswitchIcon sx={{ mr: 1 }} />
                     <Typography variant="button">Cambiar Lente</Typography>
                  </IconButton>
               </Box>
            )}
          </Box>
        </>
      )}

      {/* CARGANDO */}
      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
           <CircularProgress color="success" />
           <Typography color="white" mt={2}>Iniciando Lente HD...</Typography>
        </Box>
      )}

    </Box>
  );
}