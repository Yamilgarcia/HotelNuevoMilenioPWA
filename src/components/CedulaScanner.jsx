import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
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

  useEffect(() => {
    qrRef.current = new Html5Qrcode(readerId.current);

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) throw new Error("No hay cámaras");

        // 📷 Priorizar cámara trasera
        const backCamera =
          cameras.find(cam =>
            /back|rear|trasera|environment/i.test(cam.label)
          ) || cameras[cameras.length - 1];

        await qrRef.current.start(
          { deviceId: { exact: backCamera.id } },
          {
            fps: 15,
            qrbox: { width: 320, height: 200 },
            aspectRatio: 1,
            disableFlip: true,
            videoConstraints: {
              facingMode: "environment",
              focusMode: "continuous",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          },
          (decodedText) => {
            if (decodedText && decodedText.length > 25) {
              qrRef.current.stop().then(() => {
                onScanSuccess(decodedText);
              });
            }
          },
          () => {}
        );

        // 🔦 Detectar soporte de linterna
        try {
          await qrRef.current.applyVideoConstraints({
            advanced: [{ torch: false }]
          });
          setTorchSupported(true);
        } catch {
          setTorchSupported(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error cámara:", err);
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, [onScanSuccess]);

  const toggleFlash = async () => {
    if (!qrRef.current || !torchSupported) return;

    try {
      await qrRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(prev => !prev);
    } catch (err) {
      console.warn("Linterna no soportada", err);
    }
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
      {!loading && (
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

        <IconButton
          onClick={onClose}
          sx={{ color: 'white', bgcolor: 'rgba(255,0,0,0.7)' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
