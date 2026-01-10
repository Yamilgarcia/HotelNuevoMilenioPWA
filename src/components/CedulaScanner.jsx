import React, { useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- PLAN DE RESPALDO: PREPARACIÓN MANUAL DE IMAGEN (SOLO PARA PC/FOTOS DIFÍCILES) ---
  const prepareImage = (file, rotation) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // 1200px es seguro y rápido
                const targetSize = 1200; 
                let width = img.width;
                let height = img.height;
                
                // Escalar
                if (width > height) {
                    if (width > targetSize) { height *= targetSize / width; width = targetSize; }
                } else {
                    if (height > targetSize) { width *= targetSize / height; height = targetSize; }
                }

                // Rotar dimensiones
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
                
                // Rotar contexto
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(rotation * Math.PI / 180);
                ctx.drawImage(img, -width / 2, -height / 2, width, height);

                // Filtro B/N (Alto Contraste)
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
    event.target.value = ''; // Limpiar para permitir reintentos

    setLoading(true);
    setErrorMsg("");
    setStatus("Iniciando motor...");

    // 🚀 AQUÍ ESTÁ LA MAGIA DEL CÓDIGO VIEJO 🚀
    // Activamos experimentalFeatures para que use el chip nativo de Android
    const html5QrCode = new Html5Qrcode("reader-hidden", {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false
    });

    try {
        // --- FASE 1: LECTURA DIRECTA (ANDROID NATIVO) ---
        // Esto debería funcionar al instante en tu celular con la foto vertical
        try {
            console.log("🔵 Fase 1: Intento directo con Chip Nativo...");
            setStatus("Analizando con Android...");
            const res = await html5QrCode.scanFileV2(file, true);
            if (res && res.length > 15) {
                console.log("🟢 ¡Éxito Nativo!");
                onScanSuccess(res);
                return;
            }
        } catch (e) {
            console.log("🔸 Falló nativo, activando modo compatibilidad PC...");
        }

        // --- FASE 2: MODO COMPATIBILIDAD (ROTACIÓN MANUAL) ---
        // Si falla (ej: en PC), rotamos la imagen manualmente
        const angles = [0, 90, 270];

        for (let angle of angles) {
            setStatus(`Probando ángulo ${angle}°...`);
            console.log(`🔵 Fase 2: Probando ${angle}°`);
            
            const rotatedFile = await prepareImage(file, angle);
            
            try {
                // Incluso aquí usamos el chip nativo si está disponible
                const res = await html5QrCode.scanFileV2(rotatedFile, true);
                if (res && res.length > 15) {
                    console.log(`🟢 ¡Éxito en ${angle}°!`);
                    onScanSuccess(res);
                    return;
                }
            } catch (e) {
                // Continuar al siguiente ángulo
            }
        }

        throw new Error("No se pudo leer");

    } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMsg("⚠️ No se pudo leer. Intenta acercarte o usar más luz.");
    } finally {
        // Limpieza vital
        try { html5QrCode.clear(); } catch(e) {}
    }
  };

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Escáner Pro</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublishedWithChangesIcon sx={{ color: '#fbbf24', animation: 'spin 2s linear infinite' }} />
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
                <Typography color="#fca5a5" variant="caption">Consejo: Usa Flash y toma la foto centrada.</Typography>
              </Box>
            )}
          </>
        )}

        {/* INPUTS OCULTOS */}
        {/* capture="environment" obliga a Android a abrir la cámara trasera */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        
        {/* Input normal para galería */}
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        
        {/* Div oculto OBLIGATORIO para que html5-qrcode funcione */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}