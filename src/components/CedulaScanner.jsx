import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, Button, IconButton, Select, MenuItem } from '@mui/material';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import CloseIcon from '@mui/icons-material/Close';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // 1. INICIAR: Pedir permisos y listar cámaras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        
        // TRUCO SAMSUNG: Normalmente la cámara "back 0" es la gran angular (mala)
        // y la "back 1" es la principal (buena). Intentamos seleccionar la última.
        const lastCamera = devices[devices.length - 1].id;
        setSelectedCameraId(lastCamera);
        startScanner(lastCamera);
      }
    }).catch(err => {
      console.error("Error cámaras", err);
      alert("Error: No se detectaron cámaras.");
    });

    return () => stopScanner();
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.log("Stop error", err);
      }
    }
  };

  const startScanner = (cameraId) => {
    // Si ya hay una instancia, la detenemos antes de arrancar la nueva
    if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
            initScanner(cameraId);
        }).catch(() => initScanner(cameraId));
    } else {
        initScanner(cameraId);
    }
  };

  const initScanner = (cameraId) => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    // CONFIGURACIÓN DE ORO (Copiada de la que te funcionaba)
    const config = { 
      fps: 10,
      qrbox: { width: 300, height: 180 }, 
      aspectRatio: 1.0,
      // Desactivamos el "native detector" aquí porque en video a veces da problemas de foco
      // y confiamos en la lectura óptica tradicional que es rápida en video.
      disableFlip: false 
    };

    html5QrCode.start(
      cameraId, 
      {
        // ESTO ES LO QUE ARREGLA EL ENFOQUE
        focusMode: "continuous",       // Exige autoenfoque continuo
        width: { min: 1024, ideal: 1280, max: 1920 }, // Exige resolución HD (activa lente principal)
        height: { min: 576, ideal: 720, max: 1080 }
      },
      (decodedText) => {
        // Éxito
        if (decodedText.length > 15) {
            // Reproducir sonido beep si quieres
            stopScanner();
            onScanSuccess(decodedText);
        }
      },
      (errorMessage) => {
        // Ignorar errores por frame
      }
    ).then(() => {
      setIsScanning(true);
    }).catch(err => {
      console.error("Error start", err);
    });
  };

  const handleCameraChange = (event) => {
    const newId = event.target.value;
    setSelectedCameraId(newId);
    startScanner(newId);
  };

  const cycleCamera = () => {
     if (cameras.length === 0) return;
     const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
     const nextIndex = (currentIndex + 1) % cameras.length;
     const nextId = cameras[nextIndex].id;
     setSelectedCameraId(nextId);
     startScanner(nextId);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      bgcolor: 'black', 
      color: 'white', 
      borderRadius: 4, 
      overflow: 'hidden',
      maxWidth: '500px',
      margin: '0 auto',
      height: '550px', // Altura fija
      display: 'flex', 
      flexDirection: 'column'
    }}>
      
      {/* Botón Cerrar */}
      <IconButton 
        onClick={onClose} 
        sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
      >
        <CloseIcon />
      </IconButton>

      {/* ÁREA DE VIDEO */}
      <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#000' }}>
         <div id="reader" style={{ width: '100%', height: '100%' }}></div>
         
         {/* Guía visual */}
         <Box sx={{ 
             position: 'absolute', top: '50%', left: '50%', 
             transform: 'translate(-50%, -50%)', 
             width: '280px', height: '180px', 
             border: '2px solid rgba(74, 222, 128, 0.5)', 
             borderRadius: 2,
             boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // Oscurece el resto
             zIndex: 1,
             pointerEvents: 'none'
         }} />
         
         <Typography variant="caption" sx={{ 
             position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', 
             color: '#fff', textShadow: '0 1px 3px black', zIndex: 5 
         }}>
             Mueve el celular adelante/atrás para enfocar
         </Typography>
      </Box>

      {/* CONTROLES INFERIORES */}
      <Box sx={{ p: 2, bgcolor: '#1e293b', textAlign: 'center', zIndex: 5 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <CenterFocusStrongIcon sx={{ color: '#4ade80' }} />
            <Select
                value={selectedCameraId}
                onChange={handleCameraChange}
                variant="standard"
                disableUnderline
                sx={{ color: 'white', fontSize: '0.9rem', maxWidth: '200px' }}
            >
                {cameras.map((cam, idx) => (
                    <MenuItem key={cam.id} value={cam.id}>
                        {cam.label || `Cámara ${idx + 1}`}
                    </MenuItem>
                ))}
            </Select>
        </Box>

        <Button 
            variant="contained" 
            color="warning" 
            startIcon={<CameraswitchIcon />}
            onClick={cycleCamera}
            fullWidth
            sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3 }}
        >
            CAMBIAR CÁMARA
        </Button>
      </Box>
    </Box>
  );
}