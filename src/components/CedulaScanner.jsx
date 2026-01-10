import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [mensaje, setMensaje] = useState("Buscando código...");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 280, height: 280 }, // Cuadro grande
        aspectRatio: 1.0,
        disableFlip: false, 
        // QUITAMOS la restricción de formatos para que detecte mejor
      },
      false
    );

    const onDetect = (decodedText) => {
      // ESTRATEGIA INTELIGENTE:
      // El código de barras pequeño tiene como 8-10 caracteres (ej: AHF98052)
      // El cuadro grande PDF417 tiene CIENTOS de caracteres.
      
      if (decodedText.length < 15) {
        // Es el código de barras pequeño o basura -> Lo ignoramos
        setMensaje("⚠️ Código pequeño ignorado. Busca el cuadro grande.");
        console.log("Ignorado (muy corto):", decodedText);
      } else {
        // ¡Es el grande!
        scanner.clear();
        onScanSuccess(decodedText);
      }
    };

    const onError = (err) => {
      // Ignoramos errores de no detección
    };

    scanner.render(onDetect, onError);

    return () => {
      scanner.clear().catch(err => console.error("Error limpieza", err));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Escaneando Cédula
      </Typography>
      
      {/* Mensaje dinámico para ayudar al usuario */}
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#fbbf24', fontWeight: 'bold' }}>
        {mensaje}
      </Typography>
      
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
      
      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar
      </Button>
    </Box>
  );
}