import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [mensaje, setMensaje] = useState("Iniciando cámara HD...");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        // CAMBIO CLAVE: Caja más grande para que sea más fácil apuntar
        qrbox: { width: 350, height: 300 }, 
        aspectRatio: 1.0,
        disableFlip: false, 
        videoConstraints: {
            facingMode: "environment", 
            // Mantenemos la alta resolución, es vital para PDF417
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 },
            focusMode: "continuous"
        }
      },
      false
    );

    const onDetect = (decodedText) => {
      // Filtramos basura corta
      if (decodedText.length < 15) {
        setMensaje("⏳ Detectando... (Acerca o aleja un poco)");
      } else {
        scanner.clear();
        onScanSuccess(decodedText);
      }
    };

    scanner.render(onDetect, () => {});

    return () => {
      scanner.clear().catch(err => console.error(err));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Escaneando...</Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#fbbf24' }}>
        {mensaje}
      </Typography>
      
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
      
      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar
      </Button>
    </Box>
  );
}