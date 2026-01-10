import React, { useEffect, useState, useRef } from 'react';
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
  const [activeCameraLabel, setActiveCameraLabel] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1.5); // Empezamos con un poco de zoom para evitar distorsión

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    setHtml5QrCode(scanner);

    // 1. OBTENER CÁMARAS Y SELECCIONAR LA MEJOR
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Filtramos solo las traseras
            const backCameras = devices.filter(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('trasera') || 
                d.label.toLowerCase().includes('environment')
            );
            
            const camerasToUse = backCameras.length > 0 ? backCameras : devices;
            setCameras(camerasToUse);

            // INTELIGENCIA: Intentar evitar la "Wide" o "0" si hay varias
            // En Samsung, a veces la principal no es la 0. Probaremos buscar una que NO diga "wide".
            let bestIndex = 0;
            const normalCamIndex = camerasToUse.findIndex(c => 
                !c.label.toLowerCase().includes('wide') && 
                !c.label.toLowerCase().includes('ultra')
            );
            
            if (normalCamIndex !== -1) {
                bestIndex = normalCamIndex;
            }

            // Iniciamos con la cámara elegida
            setCurrentCameraIndex(bestIndex);
            startCamera(scanner, camerasToUse[bestIndex]);
        } else {
            alert("No se detectaron cámaras.");
            setLoading(false);
        }
    }).catch(err => {
        console.error("Error permisos cámara", err);
        setLoading(false);
        alert("Error de permisos de cámara.");
    });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(e => console.error(e));
      }
    };
  }, []);

  const startCamera = (scanner, cameraObj) => {
    setLoading(true);
    setActiveCameraLabel(cameraObj.label); // Guardamos el nombre para mostrarlo
    
    scanner.start(
      cameraObj.id, 
      {
        fps: 25, // Máxima fluidez
        qrbox: { width: 300, height: 180 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
            focusMode: "continuous",
            height: { min: 720, ideal: 1080 } // HD Obligatorio
        }
      },
      (decodedText) => {
          if (decodedText.length > 15) {
             scanner.stop().then(() => onScanSuccess(decodedText));
          }
      },
      (errorMessage) => {}
    ).then(() => {
        setLoading(false);
        // Intentar aplicar zoom inicial
        setTimeout(() => applyZoom(scanner, 1.5), 500);
    }).catch(err => {
        console.error(err);
        setLoading(false);
        // Si falla la elegida, intentar con la siguiente
        alert(`No se pudo abrir ${cameraObj.label}. Intenta cambiar de cámara.`);
    });
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    
    // Detener actual e iniciar la siguiente
    html5QrCode.stop().then(() => {
        startCamera(html5QrCode, cameras[nextIndex]);
    }).catch(err => {
        // Si ya estaba detenida o error, forzamos inicio
        startCamera(html5QrCode, cameras[nextIndex]);
    });
  };

  const applyZoom = (scanner, value) => {
      try {
          const track = document.querySelector("video")?.srcObject?.getVideoTracks()[0];
          if (track && track.getCapabilities && track.getCapabilities().zoom) {
              track.applyConstraints({ advanced: [{ zoom: value }] });
          }
      } catch (e) { console.log("Zoom no disponible"); }
  };

  const handleZoomChange = (e, newValue) => {
      setZoom(newValue);
      applyZoom(html5QrCode, newValue);
  };

  const toggleFlash = () => {
      try {
          const track = document.querySelector("video")?.srcObject?.getVideoTracks()[0];
          track.applyConstraints({ advanced: [{ torch: !torchOn }] })
               .then(() => setTorchOn(!torchOn))
               .catch(() => alert("Flash no disponible en este lente"));
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
             
             {/* Feedback de qué cámara se está usando */}
             <Typography variant="caption" sx={{ 
                 position: 'absolute', top: 60, color: 'rgba(255,255,255,0.5)', 
                 bgcolor: 'rgba(0,0,0,0.3)', px: 1, borderRadius: 1 
             }}>
                Lente: {activeCameraLabel || `Cámara ${currentCameraIndex + 1}`}
             </Typography>

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

          {/* Controles Inferiores */}
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
             
             {/* Botón Cambiar Cámara Mejorado */}
             {cameras.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                   <IconButton 
                        onClick={switchCamera} 
                        sx={{ 
                            color: 'white', border: '1px solid white', borderRadius: 4, px: 3,
                            bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                   >
                      <CameraswitchIcon sx={{ mr: 1 }} /> 
                      <Typography variant="button" sx={{fontSize: '0.8rem'}}>
                        Cambiar Lente ({currentCameraIndex + 1}/{cameras.length})
                      </Typography>
                   </IconButton>
                </Box>
             )}
          </Box>
        </>
      )}

      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
           <CircularProgress color="success" />
           <Typography color="white" mt={2}>Cargando Lente HD...</Typography>
        </Box>
      )}
    </Box>
  );
}