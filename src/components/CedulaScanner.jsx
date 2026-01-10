import React, { useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- TRUCO DE MAGIA: REDIMENSIONAR IMAGEN ---
  // Esto convierte la foto gigante de 108MP del S21 a algo que la web pueda leer
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const elem = document.createElement('canvas');
          // Reducimos a un ancho máximo de 1000px (Suficiente para PDF417 y muy rápido)
          const scaleFactor = 1000 / img.width;
          elem.width = 1000;
          elem.height = img.height * scaleFactor;
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, elem.width, elem.height);
          // Devolvemos la imagen como archivo Blob procesado
          ctx.canvas.toBlob((blob) => {
            resolve(new File([blob], "resized.jpg", { type: "image/jpeg" }));
          }, 'image/jpeg', 0.9);
        };
      };
    });
  };

  const handleFileChange = async (event) => {
    const originalFile = event.target.files[0];
    if (!originalFile) return;

    setLoading(true);
    setErrorMsg("");

    try {
      // 1. APLICAMOS EL TRUCO: Redimensionar primero
      const resizedFile = await resizeImage(originalFile);

      // 2. Iniciamos el motor
      const html5QrCode = new Html5Qrcode("reader-hidden");

      // 3. Leemos la imagen optimizada
      // true = usa el motor robusto V2
      const decodedText = await html5QrCode.scanFileV2(resizedFile, true);

      if (decodedText && decodedText.length > 15) {
        html5QrCode.clear();
        onScanSuccess(decodedText);
      } else {
        throw new Error("Lectura inválida");
      }

    } catch (err) {
      console.error("Fallo lectura:", err);
      setLoading(false);
      
      // Si falla, intentamos una vez más con la imagen original por si acaso
      if (err?.message !== "Reintento fallido") {
         console.log("Intentando con imagen original...");
         try {
            const html5QrCodeRetry = new Html5Qrcode("reader-hidden-retry");
            const retryText = await html5QrCodeRetry.scanFileV2(originalFile, true);
            if (retryText) {
                onScanSuccess(retryText);
                return;
            }
         } catch(e) { /* Falló el reintento también */ }
      }

      setErrorMsg("No se pudo leer el código PDF417. Prueba de nuevo.");
      event.target.value = ''; 
    }
  };

  return (
    <Card sx={{ 
      maxWidth: 500, margin: '0 auto', borderRadius: 4, 
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' 
    }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Escáner de Cédula</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5 }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Typography sx={{ mt: 2, color: '#94a3b8' }}>Analizando y mejorando imagen...</Typography>
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
                <Typography color="#fca5a5" variant="body2" fontWeight="bold">❌ {errorMsg}</Typography>
                <Typography color="#fca5a5" variant="caption" display="block">Tips: Usa Flash y Zoom 2x.</Typography>
              </Box>
            )}
          </>
        )}

        {!loading && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 3 }}>
            <FlashOnIcon sx={{ color: '#fbbf24' }} />
            <Typography variant="caption" color="#cbd5e1" sx={{ alignSelf: 'center' }}>
               IMPORTANTE: Activa el Flash y usa Zoom 2x
            </Typography>
          </Box>
        )}

        {/* INPUTS OCULTOS */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

        {/* MOTORES INVISIBLES (Necesarios 2 por si acaso) */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>
        <div id="reader-hidden-retry" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8', textDecoration: 'underline' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}