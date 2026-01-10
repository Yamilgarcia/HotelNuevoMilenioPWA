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
        qrbox: { width: 300, height: 250 }, 
        aspectRatio: 1.0,
        disableFlip: false, 
        // ⚠️ ESTO ES LO NUEVO: FORZAMOS CALIDAD HD
        videoConstraints: {
            facingMode: "environment", // Cámara trasera
            width: { min: 1024, ideal: 1280, max: 1920 }, // Resolución Alta
            height: { min: 576, ideal: 720, max: 1080 },
            focusMode: "continuous" // Autoenfoque (si el navegador lo permite)
        }
      },
      false
    );

    const onDetect = (decodedText) => {
      // Ignorar códigos cortos (barras pequeñas)
      if (decodedText.length < 15) {
        setMensaje("⚠️ Código pequeño ignorado. Busca el cuadro denso.");
      } else {
        scanner.clear();
        onScanSuccess(decodedText);
      }
    };

    const onError = (err) => {
      // Sin acción en error
    };

    scanner.render(onDetect, onError);

    return () => {
      scanner.clear().catch(err => console.error("Error limpieza", err));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Escaneando Cédula (HD)
      </Typography>
      
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#fbbf24', fontWeight: 'bold' }}>
        {mensaje}
      </Typography>
      
      {/* Mensaje de ayuda técnica */}
      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#aaa', fontSize: '0.7rem' }}>
        Tip: Mueve el celular adelante y atrás lentamente para enfocar.
      </Typography>

      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
      
      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar
      </Button>
    </Box>
  );
}