import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, IconButton, CircularProgress, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';

import './CedulaScanner.css';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const qrRef = useRef(null);
  const readerId = useRef(`reader-${crypto.randomUUID()}`);

  const [loading, setLoading] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [camIndex, setCamIndex] = useState(0);
  const [noCamFound, setNoCamFound] = useState(false);

  const scannerConfig = {
    fps: 15,
    qrbox: { width: 340, height: 220 },
    disableFlip: true,
    videoConstraints: {
      facingMode: "environment",
      focusMode: "continuous",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  useEffect(() => {
    qrRef.current = new Html5Qrcode(readerId.current);

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices?.length) throw new Error("No hay cámaras");

        // Solo traseras
        const backCameras = devices.filter(d =>
          /back|rear|trasera|environment/i.test(d.label)
        );
        if (!backCameras.length) throw new Error("No se encontró cámara trasera");

        setCameras(backCameras);
        setLoading(false);

        // Intento automático de enfoque (primer cámara)
        tryCamera(backCameras[0]);
      } catch (err) {
        console.error("Error al iniciar cámara:", err);
        setLoading(false);
        setNoCamFound(true);
      }
    };

    initScanner();

    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryCamera = async (camera) => {
    if (!qrRef.current) return;
    try {
      await qrRef.current.start(
        { deviceId: { exact: camera.id } },
        scannerConfig,
        (decodedText) => {
          if (decodedText && decodedText.length > 25) {
            qrRef.current.stop().then(() => onScanSuccess(decodedText));
          }
        }
      );

      // Detectar soporte de linterna
      try {
        await qrRef.current.applyVideoConstraints({ advanced: [{ torch: false }] });
        setTorchSupported(true);
      } catch {
        setTorchSupported(false);
      }
    } catch (err) {
      console.warn("Fallo con cámara:", camera.label, err);
    }
  };

  const toggleFlash = async () => {
    if (!qrRef.current || !torchSupported) return;
    try {
      await qrRef.current.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(prev => !prev);
    } catch (err) {
      console.warn("Linterna no soportada", err);
    }
  };

  const switchCamera = async () => {
    if (!cameras.length || !qrRef.current) return;

    await qrRef.current.stop().catch(() => {});
    const nextIndex = (camIndex + 1) % cameras.length;
    setCamIndex(nextIndex);
    tryCamera(cameras[nextIndex]);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 420,
        bgcolor: 'black',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Video */}
      <div
        id={readerId.current}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            bgcolor: 'rgba(0,0,0,0.6)'
          }}
        >
          <CircularProgress color="success" />
          <Typography color="white" variant="body2">
            Iniciando cámara HD…
          </Typography>
        </Box>
      )}

      {/* Overlay */}
      {!loading && !noCamFound && (
        <div className="scanner-overlay">
          <div className="scanner-box">
            <div className="scanner-line" />
          </div>
          <Typography className="scanner-text">
            Enfoca el código trasero de la cédula
          </Typography>
        </div>
      )}

      {/* Controles */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 20,
          display: 'flex',
          gap: 1
        }}
      >
        {torchSupported && (
          <IconButton
            onClick={toggleFlash}
            sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
          </IconButton>
        )}

        {cameras.length > 1 && (
          <Button
            variant="contained"
            size="small"
            onClick={switchCamera}
            sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'black' }}
          >
            Cambiar cámara
          </Button>
        )}

        <IconButton
          onClick={onClose}
          sx={{ color: 'white', bgcolor: 'rgba(255,0,0,0.7)' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {noCamFound && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
            px: 2
          }}
        >
          <Typography>No se encontró cámara trasera compatible 😢</Typography>
          <Button onClick={onClose} variant="contained" sx={{ mt: 2 }}>Cerrar</Button>
        </Box>
      )}
    </Box>
  );
}
