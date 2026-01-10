import React, { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  
  useEffect(() => {
    // Configuración estricta: SOLO PDF417
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 300, height: 200 }, // Rectángulo más ancho para el PDF417
        aspectRatio: 1.0,
        disableFlip: false,
        // ESTO ES LO NUEVO: Forzamos a que solo lea PDF_417
        formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417 ]
      },
      /* verbose= */ false
    );

    const onDetect = (decodedText) => {
      // Solo si el texto es largo (una cédula tiene muchos datos) lo aceptamos
      if (decodedText.length > 20) {
        scanner.clear();
        onScanSuccess(decodedText);
      } else {
        console.log("Lectura ignorada (muy corta):", decodedText);
      }
    };

    const onError = (err) => {
      // Ignoramos errores de escaneo
    };

    scanner.render(onDetect, onError);

    return () => {
      scanner.clear().catch(error => console.error("Error limpieza scanner", error));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Escaneando Cédula...
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#facc15' }}>
        Enfoca el cuadro grande de puntos.
        <br/>(Tapa con el dedo el código de barras vertical si molesta)
      </Typography>
      
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>

      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar
      </Button>
    </Box>
  );
}