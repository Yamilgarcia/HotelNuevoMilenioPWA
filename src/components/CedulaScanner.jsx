import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [scannerActivo, setScannerActivo] = useState(false);
  const [mensaje, setMensaje] = useState("Presiona el botón para abrir la cámara");

  useEffect(() => {
    if (!scannerActivo) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 300, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment",
          width: { min: 1024, ideal: 1280, max: 1920 },
          height: { min: 576, ideal: 720, max: 1080 },
          focusMode: "continuous"
        }
      },
      false
    );

    const onDetect = (decodedText) => {
      if (decodedText.length < 15) {
        setMensaje("⚠️ Acerca o aleja el teléfono lentamente");
      } else {
        scanner.clear();
        onScanSuccess(decodedText);
      }
    };

    scanner.render(onDetect, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scannerActivo, onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Escaneo de Cédula
      </Typography>

      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#fbbf24' }}>
        {mensaje}
      </Typography>

      {!scannerActivo ? (
        <>
          <Typography variant="body2" sx={{ mb: 2, color: '#aaa' }}>
            Se abrirá la cámara del dispositivo para tomar la foto o elegir una imagen.
          </Typography>

          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={() => setScannerActivo(true)}
          >
            Abrir cámara
          </Button>

          <Button
            onClick={onClose}
            variant="text"
            color="inherit"
            sx={{ mt: 2 }}
          >
            Cancelar
          </Button>
        </>
      ) : (
        <>
          <div
            id="reader"
            style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
          />

          <Button
            onClick={onClose}
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
          >
            Cancelar
          </Button>
        </>
      )}
    </Box>
  );
}
