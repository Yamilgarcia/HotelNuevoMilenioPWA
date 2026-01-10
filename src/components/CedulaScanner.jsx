import React, { useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import HdrAutoIcon from '@mui/icons-material/HdrAuto';

// Importamos el motor
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- FUNCIÓN DE RESCATE: Redimensionar a HD (1500px) ---
  // Esto evita que la librería reduzca la foto a 300px y la arruine.
  const resizeToHD = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // 1500px es el punto dulce: Se ven los puntos del PDF417 pero no cuelga el celular
                const maxDim = 1500; 
                let width = img.width;
                let height = img.height;
                
                if (width > maxDim || height > maxDim) {
                    const scale = maxDim / Math.max(width, height);
                    width *= scale;
                    height *= scale;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Retornamos imagen en alta calidad
                canvas.toBlob(blob => resolve(new File([blob], "hd_resize.jpg", { type: "image/jpeg" })), 'image/jpeg', 0.95);
            };
            img.src = e.target.result;
        };
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = ''; // Limpiar input

    setLoading(true);
    setErrorMsg("");
    setStatus("Analizando...");

    // 1. CONFIGURACIÓN IDÉNTICA A TU CÓDIGO BASE
    const html5QrCode = new Html5Qrcode("reader-hidden", {
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // ¡El secreto!
        },
        verbose: false
    });

    try {
        // INTENTO 1: Directo (Como lo hace el código base)
        try {
            console.log("🔵 Intento 1: Directo");
            const res = await html5QrCode.scanFileV2(file, true);
            if (res && res.length > 15) {
                console.log("🟢 ¡Éxito Directo!");
                onScanSuccess(res);
                return;
            }
        } catch (e) {
            console.log("🔸 Falló directo, aplicando corrección HD...");
        }

        // INTENTO 2: Forzando HD (Si el directo falló por tamaño)
        // Esto soluciona el error "Image downsampled to 300x400"
        setStatus("Mejorando calidad...");
        const hdFile = await resizeToHD(file);
        
        try {
            console.log("🔵 Intento 2: HD Resize");
            const res = await html5QrCode.scanFileV2(hdFile, true);
            if (res && res.length > 15) {
                console.log("🟢 ¡Éxito HD!");
                onScanSuccess(res);
                return;
            }
        } catch (e) {
            console.log("🔸 Falló HD.");
        }

        throw new Error("No se pudo leer el código.");

    } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMsg("⚠️ No se pudo leer. Intenta acercarte o usar más luz.");
    } finally {
        try { html5QrCode.clear(); } catch(e) {}
    }
  };

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Escáner Nativo</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HdrAutoIcon sx={{ color: '#fbbf24' }} />
                <Typography sx={{ color: '#fbbf24', fontWeight: 'bold' }}>{status}</Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                
                {/* BOTÓN CÁMARA NATIVA */}
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
              </Box>
            )}
          </>
        )}

        {/* INPUTS OCULTOS - AQUÍ ESTÁ LA MAGIA DEL NATIVO */}
        {/* capture="environment" abre la cámara trasera directamente */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        
        {/* Div oculto necesario para el motor */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}