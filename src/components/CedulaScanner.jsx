import React, { useEffect } from 'react';
// 1. IMPORTANTE: Agregamos "Html5QrcodeSupportedFormats" aquí
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  
  useEffect(() => {
    // Configuración del escáner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 300, height: 250 }, // Un poco más ancho para el PDF417
        aspectRatio: 1.0,
        disableFlip: false,
        // 2. MAGIA: Esto obliga al escáner a buscar SOLO el cuadro grande
        formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417 ] 
      },
      /* verbose= */ false
    );

    const onDetect = (decodedText) => {
      // Validación extra: Una cédula tiene muchos datos.
      // Si lee algo corto (como AHF98052), lo ignoramos.
      if (decodedText.length > 20) {
        scanner.clear();
        onScanSuccess(decodedText);
      } else {
        console.log("Lectura ignorada (muy corta):", decodedText);
      }
    };

    const onError = (err) => {
      // Ignoramos errores
    };

    scanner.render(onDetect, onError);

    return () => {
      scanner.clear().catch(error => console.error("Error al limpiar scanner", error));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Escanea el cuadro grande de puntos
      </Typography>
      
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#fbbf24' }}>
        ⚠️ Si la cámara detecta el código pequeño, tápalo con tu dedo.
      </Typography>
      
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
      
      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar
      </Button>
    </Box>
  );
}