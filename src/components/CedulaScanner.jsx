import React, { useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RotateRightIcon from '@mui/icons-material/RotateRight';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- HERRAMIENTA: PREPARAR IMAGEN (ROTAR Y REDIMENSIONAR) ---
  const prepareImage = (file, rotation) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Forzamos un tamaño bueno para PC (ni muy grande ni muy chico)
                const targetSize = 1200; 
                let width = img.width;
                let height = img.height;
                
                // Escalar manteniendo proporción
                if (width > height) {
                    if (width > targetSize) { height *= targetSize / width; width = targetSize; }
                } else {
                    if (height > targetSize) { width *= targetSize / height; height = targetSize; }
                }

                // Intercambiar dimensiones si rotamos 90 o 270
                if (rotation === 90 || rotation === 270) {
                    canvas.width = height;
                    canvas.height = width;
                } else {
                    canvas.width = width;
                    canvas.height = height;
                }

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Magia de rotación
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(rotation * Math.PI / 180);
                ctx.drawImage(img, -width / 2, -height / 2, width, height);

                // Convertir a B/N para ayudar a la PC (Alto Contraste)
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const color = avg < 100 ? 0 : 255; 
                    data[i] = color; data[i + 1] = color; data[i + 2] = color;
                }
                ctx.putImageData(imgData, 0, 0);

                canvas.toBlob(blob => resolve(new File([blob], "scan.jpg", { type: "image/jpeg" })), 'image/jpeg', 0.9);
            };
            img.src = e.target.result;
        };
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    setLoading(true);
    setErrorMsg("");
    setStatus("Analizando...");

    // Configuración para activar el Chip Nativo en celulares
    const html5QrCode = new Html5Qrcode("reader-hidden", {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false
    });

    try {
        // --- FASE 1: INTENTO RÁPIDO (Ideal para Celulares) ---
        // Le pasamos la foto tal cual. Si el navegador es inteligente (Android/iOS), la leerá.
        try {
            console.log("🔵 Intento 1: Nativo directo");
            const res = await html5QrCode.scanFileV2(file, true);
            if (res && res.length > 15) {
                console.log("🟢 Éxito Nativo");
                onScanSuccess(res);
                return;
            }
        } catch (e) {
            console.log("🔸 Falló nativo, iniciando rotaciones para PC...");
        }

        // --- FASE 2: INTENTO INTELIGENTE (Ideal para PC) ---
        // Si el nativo falló, probamos rotar la imagen manualmente.
        // Probamos: Normal (0°), Vertical (90°), Invertido (270°)
        const angles = [0, 90, 270];

        for (let angle of angles) {
            setStatus(`Probando ángulo ${angle}°...`);
            console.log(`🔵 Probando rotación manual: ${angle}°`);
            
            const rotatedFile = await prepareImage(file, angle);
            
            try {
                const res = await html5QrCode.scanFileV2(rotatedFile, true);
                if (res && res.length > 15) {
                    console.log(`🟢 Éxito en ${angle}°`);
                    onScanSuccess(res);
                    return;
                }
            } catch (e) {
                // Siguiente ángulo
            }
        }

        throw new Error("No se pudo leer");

    } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMsg("⚠️ No se pudo leer la cédula.");
    } finally {
        try { html5QrCode.clear(); } catch(e) {}
    }
  };

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Escáner Universal</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RotateRightIcon sx={{ color: '#fbbf24', animation: 'spin 2s linear infinite' }} />
                <Typography sx={{ color: '#fbbf24', fontWeight: 'bold' }}>{status}</Typography>
            </Box>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                
                {/* BOTÓN CÁMARA (NATIVA) */}
                <Button
                    onClick={() => cameraInputRef.current.click()}
                    sx={{
                        width: 180, height: 180, borderRadius: '50%',
                        background: 'linear-gradient(145deg, #334155, #1e293b)', 
                        border: '4px solid #4ade80',
                        boxShadow: '0 0 25px rgba(74, 222, 128, 0.4)',
                        display: 'flex', flexDirection: 'column', gap: 1,
                        textTransform: 'none',
                        '&:hover': { transform: 'scale(1.05)' }
                    }}
                >
                    <CameraAltIcon sx={{ fontSize: 60, color: '#fff' }} />
                    <Typography variant="h6" fontWeight="bold" color="white">TOMAR FOTO</Typography>
                </Button>

                {/* BOTÓN GALERÍA */}
                <Button 
                    onClick={() => galleryInputRef.current.click()}
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 3, px: 4 }}
                >
                    Subir desde Galería
                </Button>
            </Box>

            {errorMsg && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', borderRadius: 2, border: '1px solid #ef4444' }}>
                <Typography color="#fca5a5" variant="body2" fontWeight="bold">{errorMsg}</Typography>
                <Typography color="#fca5a5" variant="caption">Prueba rotar la imagen o usar mejor luz.</Typography>
              </Box>
            )}
          </>
        )}

        {/* INPUTS OCULTOS */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        
        {/* MOTOR OCULTO */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}