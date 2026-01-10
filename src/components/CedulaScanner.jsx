import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';
import './CedulaScanner.css'; // Asegúrate de tener el CSS para que no se vea feo

export default function CedulaScanner({ onScanSuccess, onClose }) {
  
  useEffect(() => {
    // Configuración optimizada para S21 Ultra y PDF417
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        // Hacemos la caja RECTANGULAR (como la cédula)
        qrbox: { width: 320, height: 200 }, 
        aspectRatio: 1.0,
        disableFlip: false,
        // IMPORTANTE: Esto ayuda a que lea mejor
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        },
        // Forzamos cámara trasera HD
        videoConstraints: {
            facingMode: "environment",
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 },
            focusMode: "continuous"
        }
      },
      /* verbose= */ false
    );

    // ÉXITO
    const onDetect = (decodedText) => {
        // Filtramos lecturas falsas cortas
        if (decodedText.length > 15) {
            scanner.clear().catch(err => console.error(err));
            onScanSuccess(decodedText);
        }
    };

    // ERROR (Opcional, lo dejamos vacío para no llenar la consola)
    const onError = (err) => {
       // console.warn(err);
    };

    scanner.render(onDetect, onError);

    // Limpieza al salir
    return () => {
      scanner.clear().catch(err => console.error("Error limpieza", err));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#1e293b', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
        Escáner de Cédula
      </Typography>
      
      {/* Contenedor del escáner */}
      <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', backgroundColor: 'black' }}></div>
      
      <Box sx={{ mt: 2, textAlign: 'left', bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1 }}>
         <Typography variant="caption" sx={{ display: 'block', color: '#fbbf24' }}>
           💡 <b>¿No enfoca bien?</b>
         </Typography>
         <Typography variant="caption" sx={{ display: 'block', color: '#ccc' }}>
           Usa la opción azul que dice <b>"Scan an Image File"</b> (o Escanear Archivo). 
           Eso abrirá tu cámara nativa, tomas la foto con flash y listo.
         </Typography>
      </Box>

      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }} fullWidth>
        Cancelar
      </Button>
    </Box>
  );
}