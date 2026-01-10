import React, { useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- PASO 1: REDIMENSIONAR IMAGEN (Vital para Samsung S21/S22/S23) ---
  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Reducimos a un ancho manejable de 1000px
          const elem = document.createElement('canvas');
          const scaleFactor = 1000 / img.width;
          elem.width = 1000;
          elem.height = img.height * scaleFactor;
          
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, elem.width, elem.height);
          
          ctx.canvas.toBlob((blob) => {
            if (blob) {
                // Convertimos el blob a File para que las librerías lo entiendan
                resolve(new File([blob], "resized.jpg", { type: "image/jpeg" }));
            } else {
                reject(new Error("Error al comprimir imagen"));
            }
          }, 'image/jpeg', 0.9);
        };
        img.onerror = () => reject(new Error("La imagen está corrupta"));
      };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    });
  };

  // --- PASO 2: LÓGICA DE ESCANEO SEGURA ---
  const processImage = async (file) => {
    setLoading(true);
    setErrorMsg("");
    
    try {
        // ETAPA 1: OPTIMIZACIÓN
        setStatus("Compressing image (1/3)...");
        console.log("Iniciando compresión...");
        const resizedFile = await resizeImage(file);
        console.log("Imagen comprimida con éxito.");

        // ETAPA 2: MOTOR NATIVO ANDROID (Rápido)
        if ('BarcodeDetector' in window) {
            setStatus("Probando Detector Nativo (2/3)...");
            try {
                const detector = new window.BarcodeDetector({ formats: ['pdf417'] });
                const bitmap = await createImageBitmap(resizedFile);
                const barcodes = await detector.detect(bitmap);
                bitmap.close(); // Liberar memoria
                
                const found = barcodes.find(code => code.rawValue.length > 20);
                if (found) {
                    onScanSuccess(found.rawValue);
                    return; // ¡Éxito!
                }
            } catch (e) {
                console.log("Falló detector nativo, pasando al siguiente...", e);
            }
        }

        // ETAPA 3: MOTOR JAVASCRIPT (Fallback potente)
        setStatus("Probando Motor JS (3/3)...");
        const html5QrCode = new Html5Qrcode("reader-hidden");
        try {
            const result = await html5QrCode.scanFileV2(resizedFile, true);
            if (result && result.length > 20) {
                html5QrCode.clear();
                onScanSuccess(result);
                return; // ¡Éxito!
            }
        } catch (e) {
             console.log("Falló motor JS", e);
        }

        // SI LLEGAMOS AQUÍ, NADA FUNCIONÓ
        throw new Error("No se detectó ningún código válido.");

    } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMsg("⚠️ FALLÓ: No se encontró código PDF417.");
        alert("No se pudo leer la cédula.\n\nTips:\n1. Asegúrate de usar FLASH.\n2. La foto no debe estar borrosa.\n3. Intenta alejarte un poco y usar Zoom.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Limpiamos el input para permitir seleccionar la misma foto si falla
    event.target.value = ''; 
    
    processImage(file);
  };

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Escáner Seguro</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Typography sx={{ mt: 3, color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {status}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
              Selecciona una opción:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                
                {/* BOTÓN CÁMARA */}
                <Button
                    onClick={() => cameraInputRef.current.click()}
                    variant="contained"
                    sx={{
                        width: 160, height: 160, borderRadius: '50%',
                        bgcolor: '#334155', 
                        border: '4px solid #4ade80',
                        display: 'flex', flexDirection: 'column', gap: 1,
                        transition: 'transform 0.2s',
                        '&:hover': { bgcolor: '#475569', transform: 'scale(1.05)' },
                        boxShadow: '0 0 25px rgba(74, 222, 128, 0.4)'
                    }}
                >
                    <CameraAltIcon sx={{ fontSize: 50, color: '#fff' }} />
                    <Typography variant="button" fontWeight="bold">TOMAR FOTO</Typography>
                </Button>

                {/* BOTÓN GALERÍA */}
                <Button 
                    onClick={() => galleryInputRef.current.click()}
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    size="large"
                    sx={{ 
                        color: 'white', borderColor: 'rgba(255,255,255,0.3)', 
                        borderRadius: 3, px: 4,
                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    Subir desde Galería
                </Button>
            </Box>

            {errorMsg && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.2)', borderRadius: 2, border: '1px solid #ef4444' }}>
                <Typography color="#fca5a5" variant="body2" fontWeight="bold">{errorMsg}</Typography>
              </Box>
            )}
          </>
        )}

        {!loading && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 3 }}>
            <FlashOnIcon sx={{ color: '#fbbf24' }} />
            <Typography variant="caption" color="#cbd5e1" sx={{ alignSelf: 'center' }}>
               Usa <b>Flash</b> y <b>Zoom 2x</b>
            </Typography>
          </Box>
        )}

        {/* INPUTS OCULTOS */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

        {/* Div oculto para el motor */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8', textDecoration: 'underline' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}