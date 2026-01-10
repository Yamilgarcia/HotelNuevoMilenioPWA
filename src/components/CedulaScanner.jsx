import React, { useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Limpiamos el input
    event.target.value = '';

    setLoading(true);
    setErrorMsg("");

    try {
      // 1. CONFIGURACIÓN MÁGICA (La que usa el código viejo)
      // Esto activa el "Chip Nativo" de Android que lee fotos verticales
     const html5QrCode = new Html5Qrcode("reader-hidden", {
  formatsToSupport: [Html5QrcodeSupportedFormats.PDF_417],
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: false // 🔥 CLAVE
  }
});

      // 2. ESCANEO DIRECTO
      // El modo nativo maneja fotos grandes mejor, pero por seguridad
      // la librería intentará usar el detector del sistema operativo primero.
    const decodedText = await html5QrCode.scanFile(file, true);

      if (decodedText && decodedText.length > 15) {
        html5QrCode.clear();
        onScanSuccess(decodedText);
      } else {
        throw new Error("No se detectó código válido");
      }

    } catch (err) {
      console.log("Error principal:", err);
      
      // PLAN B: Si falla el nativo, intentamos redimensionar (por si la memoria falló)
      try {
          const resized = await resizeImage(file);
          const html5QrCodeRetry = new Html5Qrcode("reader-hidden-retry", {
              formatsToSupport: [Html5QrcodeSupportedFormats.PDF_417],
              experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          });
          const retryText = await html5QrCodeRetry.scanFileV2(resized, true);
          if (retryText) {
              onScanSuccess(retryText);
              return;
          }
      } catch (e) { console.log("Falló reintento"); }

      setLoading(false);
      setErrorMsg("No se pudo leer. Intenta que el código esté recto y con buena luz.");
    }
  };

  // Función auxiliar de rescate (solo se usa si falla la primera)
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 1200 / Math.max(img.width, img.height); // Max 1200px
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => resolve(new File([blob], "fixed.jpg", { type: "image/jpeg" })), 'image/jpeg', 0.9);
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
          <Typography variant="h5" fontWeight="bold">Escáner Pro</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5 }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Typography sx={{ mt: 2, color: '#94a3b8' }}>Analizando con IA de Android...</Typography>
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
              </Box>
            )}
          </>
        )}

        {/* INPUTS OCULTOS */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

        {/* ELEMENTOS OCULTOS NECESARIOS PARA LA LIBRERÍA */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>
        <div id="reader-hidden-retry" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8', textDecoration: 'underline' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}