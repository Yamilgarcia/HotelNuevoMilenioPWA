import React, { useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AndroidIcon from '@mui/icons-material/Android';

// Importamos Html5Qrcode solo como plan de respaldo
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Limpiamos el input para que puedas reintentar si quieres
    event.target.value = '';

    setLoading(true);
    setErrorMsg("");
    setStatus("Procesando imagen...");

    try {
        // --- PASO 1: INTENTO CON CHIP NATIVO DE SAMSUNG (ANDROID) ---
        // Este es el método más rápido y potente. Lee fotos verticales.
        if ('BarcodeDetector' in window) {
            try {
                setStatus("Analizando con Chip Nativo...");
                
                // 1. Crear detector para PDF417
                const detector = new window.BarcodeDetector({ formats: ['pdf417'] });
                
                // 2. Convertir la foto a un formato ultra-rápido (Bitmap)
                // Esto evita que el celular se congele con fotos de 108MP
                const bitmap = await createImageBitmap(file);
                
                try {
                    const barcodes = await detector.detect(bitmap);
                    // Buscamos el código de la cédula (debe ser largo)
                    const found = barcodes.find(code => code.rawValue.length > 20);
                    
                    if (found) {
                        console.log("¡Leído con Android Nativo!");
                        onScanSuccess(found.rawValue);
                        return; // ¡ÉXITO!
                    }
                } finally {
                    bitmap.close(); // Liberar memoria obligatoriamente
                }
            } catch (e) {
                console.log("Fallo nativo, pasando al plan B...", e);
            }
        }

        // --- PASO 2: PLAN B - LIBRERÍA JS (SI FALLA EL NATIVO) ---
        // Si el nativo falla, usamos la librería pero con la foto reducida
        setStatus("Usando motor secundario...");
        
        const html5QrCode = new Html5Qrcode("reader-hidden", {
            formatsToSupport: [Html5QrcodeSupportedFormats.PDF_417],
            verbose: false
        });

        // Reducimos la imagen antes de pasarla al motor JS para que no tarde 10 min
        const resizedImage = await resizeImage(file);
        const result = await html5QrCode.scanFileV2(resizedImage, true);
        
        if (result && result.length > 20) {
            html5QrCode.clear();
            onScanSuccess(result);
            return;
        }

        throw new Error("No se pudo leer");

    } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMsg("⚠️ No se detectó la cédula.");
    }
  };

  // Función auxiliar para reducir imagen (solo para el Plan B)
  const resizeImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Máximo 1200px para que sea rápido
                const scale = 1200 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(b => resolve(new File([b], "r.jpg", {type:"image/jpeg"})), 'image/jpeg', 0.9);
            };
            img.src = e.target.result;
        };
    });
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
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AndroidIcon sx={{ color: '#a3e635' }} />
                <Typography sx={{ color: '#fbbf24' }}>{status}</Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                
                {/* ESTE BOTÓN ABRE LA CÁMARA NATIVA DE SAMSUNG */}
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
                <Typography color="#fca5a5" variant="caption">Intenta tomar la foto un poco más lejos y con Flash.</Typography>
              </Box>
            )}
          </>
        )}

        {/* INPUTS OCULTOS */}
        {/* capture="environment" ES LO QUE FUERZA LA CÁMARA NATIVA */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        
        {/* Div necesario para el Plan B */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}