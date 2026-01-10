import React, { useEffect, useState } from 'react';
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
  const [activeCameraId, setActiveCameraId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1); // Zoom por defecto 1x

  useEffect(() => {
    // 1. Instancia el escáner
    const scanner = new Html5Qrcode("reader");
    setHtml5QrCode(scanner);

    // 2. Obtener lista real de cámaras y buscar la trasera
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            setCameras(devices);
            
            // LÓGICA DE BÚSQUEDA DE CÁMARA TRASERA
            // Buscamos la que diga "back", "trasera" o "environment"
            let backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('0'));
            
            // Si no encuentra una con nombre obvio, usamos la última de la lista (suele ser la trasera en Android)
            if (!backCamera && devices.length > 1) {
                backCamera = devices[devices.length - 1];
            }

            const cameraIdToUse = backCamera ? backCamera.id : devices[0].id;
            
            startCamera(scanner, cameraIdToUse);
        } else {
            alert("Error: No se detectaron cámaras.");
            setLoading(false);
        }
    }).catch(err => {
        console.error("Error pidiendo cámaras", err);
        setLoading(false);
        alert("Error de permisos de cámara.");
    });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(e => console.error("Error stop", e));
      }
    };
  }, []);

  const startCamera = (scanner, cameraId) => {
    setLoading(true);
    setActiveCameraId(cameraId);
    
    scanner.start(
      cameraId, // <--- AQUÍ FORZAMOS EL ID EXACTO (No dejamos que el navegador adivine)
      {
        fps: 20, // Más rápido
        qrbox: { width: 300, height: 180 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
            focusMode: "continuous",
            height: { min: 720, ideal: 1080 } // HD
        }
      },
      (decodedText) => {
          // Éxito: Solo si es largo (evita códigos de barra pequeños)
          if (decodedText.length > 15) {
             scanner.stop().then(() => onScanSuccess(decodedText));
          }
      },
      (errorMessage) => { 
          // Ignorar errores de no-lectura 
      }
    ).then(() => {
        setLoading(false);
        // Intentamos poner zoom inicial de 1.5x si es posible para ayudar al enfoque
        setTimeout(() => applyZoom(scanner, 1.5), 500);
        setZoom(1.5);
    }).catch(err => {
        console.error(err);
        setLoading(false);
        alert("No se pudo iniciar la cámara seleccionada.");
    });
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    
    // Buscar el índice actual
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    // Calcular el siguiente
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;

    // Detener y arrancar la nueva
    html5QrCode.stop().then(() => {
        startCamera(html5QrCode, nextCameraId);
    }).catch(err => {
        console.error("Error al cambiar", err);
        // Si falla el stop, intentamos arrancar de todas formas
        startCamera(html5QrCode, nextCameraId);
    });
  };

  const applyZoom = (scanner, value) => {
      // Función segura para aplicar zoom
      try {
          const track = scanner.html5QrCodeScanner?.videoElement?.srcObject?.getVideoTracks()[0] 
                        || document.querySelector("video")?.srcObject?.getVideoTracks()[0];
          
          if (track && track.getCapabilities && track.getCapabilities().zoom) {
              track.applyConstraints({ advanced: [{ zoom: value }] });
          }
      } catch (e) { console.log("Zoom no soportado en este lente", e); }
  };

  const handleZoomChange = (e, newValue) => {
      setZoom(newValue);
      applyZoom(html5QrCode, newValue);
  };

  const toggleFlash = () => {
      try {
          const track = document.querySelector("video")?.srcObject?.getVideoTracks()[0];
          if(track) {
              track.applyConstraints({ advanced: [{ torch: !torchOn }] })
                   .then(() => setTorchOn(!torchOn))
                   .catch(() => alert("Flash no disponible en este lente"));
          }
      } catch(e) { console.log(e); }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '500px', bgcolor: 'black', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* VIDEO */}
      <div id="reader" style={{ flex: 1, width: '100%', height: '100%' }}></div>

      {/* INTERFAZ */}
      {!loading && (
        <>
          <div className="scanner-overlay">
             <div className="scanner-box">
                <div className="scanner-line"></div>
             </div>
             <Typography variant="caption" className="scanner-text" sx={{ mt: 2 }}>
                Enfoca el código PDF417
             </Typography>
          </div>

          {/* Botones Superiores */}
          <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 20, display: 'flex', gap: 1 }}>
             <IconButton onClick={toggleFlash} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
                {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
             </IconButton>
             <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,50,50,0.8)' }}>
                <CloseIcon />
             </IconButton>
          </Box>

          {/* Controles Inferiores (Zoom y Cambio) */}
          <Box sx={{ 
            position: 'absolute', bottom: 0, left: 0, width: '100%', 
            p: 2, zIndex: 20, 
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex', flexDirection: 'column', gap: 1
          }}>
             {/* Slider Zoom */}
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2 }}>
                <ZoomInIcon sx={{ color: 'white' }} />
                <Slider value={zoom} min={1} max={4} step={0.1} onChange={handleZoomChange} sx={{ color: '#2ecc71' }} />
                <Typography color="white">{zoom}x</Typography>
             </Box>
             
             {/* Botón Cambiar Cámara (SOLO SI HAY MAS DE 1) */}
             {cameras.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                   <IconButton onClick={switchCamera} sx={{ color: 'white', border: '1px solid white', borderRadius: 4, px: 3 }}>
                      <CameraswitchIcon sx={{ mr: 1 }} /> Cambiar Cámara
                   </IconButton>
                </Box>
             )}
          </Box>
        </>
      )}

      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
           <CircularProgress color="success" />
           <Typography color="white" mt={2}>Iniciando cámara...</Typography>
        </Box>
      )}
    </Box>
  );
}