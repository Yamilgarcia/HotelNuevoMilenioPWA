import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, IconButton } from '@mui/material';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import CloseIcon from '@mui/icons-material/Close';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null); // Referencia al objeto Html5Qrcode

  useEffect(() => {
    // 1. OBTENER CÁMARAS DISPONIBLES AL INICIAR
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        // Filtramos solo las traseras (aunque a veces no traen etiqueta, tomamos todas por si acaso)
        // En Samsung S21, suelen haber varias 'back'.
        setCameras(devices);
        
        // Intentamos arrancar con la última de la lista (suele ser la principal en algunos Android)
        // O arrancamos con la 0 y dejamos que el usuario cambie.
        setCurrentCameraIndex(0);
        startScanner(devices[0].id);
      }
    }).catch(err => {
      console.error("Error al listar cámaras", err);
      alert("No se pudieron detectar cámaras.");
    });

    // Limpieza al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
        }).catch(err => console.error("Error al detener", err));
      }
    };
  }, []);

  const startScanner = (cameraId) => {
    // Si ya hay uno corriendo, detenerlo primero
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().then(() => {
        initNewScanner(cameraId);
      });
    } else {
      initNewScanner(cameraId);
    }
  };

  const initNewScanner = (cameraId) => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { 
      fps: 10, 
      qrbox: { width: 300, height: 180 }, // Caja rectangular para cédula
      aspectRatio: 1.0
    };

    html5QrCode.start(
      cameraId, 
      config,
      (decodedText) => {
        // ÉXITO
        if (decodedText.length > 15) {
            html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
            });
        }
      },
      (errorMessage) => {
        // Error de lectura (frame vacío), ignorar
      }
    ).then(() => {
      setIsScanning(true);
    }).catch(err => {
      console.error("Error al iniciar cámara", err);
    });
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;

    // Calcular siguiente índice
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    
    // Reiniciar con la nueva cámara
    const nextCameraId = cameras[nextIndex].id;
    console.log("Cambiando a cámara:", cameras[nextIndex].label);
    startScanner(nextCameraId);
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
      height: '500px',
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
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
         <div id="reader" style={{ width: '100%', height: '100%' }}></div>
      </Box>

      {/* CONTROLES INFERIORES */}
      <Box sx={{ p: 2, bgcolor: '#1e293b', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ mb: 2, color: '#94a3b8' }}>
            Cámara actual: {cameras[currentCameraIndex]?.label || `Cámara ${currentCameraIndex + 1}`}
        </Typography>

        <Button 
            variant="contained" 
            color="warning" 
            startIcon={<CameraswitchIcon />}
            onClick={switchCamera}
            fullWidth
            sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
        >
            CAMBIAR LENTE / CÁMARA
        </Button>
        
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#aaa' }}>
            Si se ve borroso o lejos, toca el botón para probar la siguiente cámara.
        </Typography>
      </Box>
    </Box>
  );
}