import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  
  useEffect(() => {
    // Configuración del escáner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, // Frames por segundo (entre más bajo, menos consume batería)
        qrbox: { width: 300, height: 150 }, // Rectángulo de enfoque (apaisado para cédulas)
        aspectRatio: 1.0,
        disableFlip: false, 
      },
      /* verbose= */ false
    );

    // Función de éxito
    const onDetect = (decodedText) => {
      // Detener escaneo al encontrar algo
      scanner.clear();
      onScanSuccess(decodedText);
    };

    const onError = (err) => {
      // Ignoramos errores de "no code found" para no saturar la consola
    };

    scanner.render(onDetect, onError);

    // Limpieza al desmontar el componente
    return () => {
      scanner.clear().catch(error => console.error("Error al limpiar scanner", error));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Escanea el código de barras trasero
      </Typography>
      
      {/* Aquí es donde la librería inyecta el video */}
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
      
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#aaa' }}>
        Intenta tener buena iluminación y enfoca bien el código PDF417.
      </Typography>

      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar Escaneo
      </Button>
    </Box>
  );
}