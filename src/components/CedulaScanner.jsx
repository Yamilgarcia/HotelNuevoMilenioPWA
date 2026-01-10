import React, { useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AndroidIcon from '@mui/icons-material/Android'; // Icono para indicar modo nativo

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- LÓGICA 1: DETECTOR NATIVO ANDROID (Lo que hacía experimentalFeatures) ---
  const scanWithNativeAndroid = async (file) => {
    if (!('BarcodeDetector' in window)) {
       throw new Error("Nativo no soportado");
    }
    
    // Crear detector específico para PDF417 (Cédula Nica)
    const detector = new window.BarcodeDetector({
      formats: ['pdf417']
    });

    // Convertir archivo a ImageBitmap (formato nativo rápido)
    const bitmap = await createImageBitmap(file);
    
    try {
      const barcodes = await detector.detect(bitmap);
      if (barcodes.length > 0) {
        // Buscamos el que sea largo (cédula real)
        const cedulaCode = barcodes.find(code => code.rawValue.length > 15);
        if (cedulaCode) return cedulaCode.rawValue;
      }
      throw new Error("No se detectó PDF417 nativo");
    } finally {
      bitmap.close(); // Liberar memoria
    }
  };

  // --- LÓGICA 2: LIBRERÍA CON REDIMENSIÓN (Fallback) ---
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const elem = document.createElement('canvas');
          const scaleFactor = 1000 / img.width; // Reducir a 1000px
          elem.width = 1000;
          elem.height = img.height * scaleFactor;
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, elem.width, elem.height);
          ctx.canvas.toBlob((blob) => {
            resolve(new File([blob], "resized.jpg", { type: "image/jpeg" }));
          }, 'image/jpeg', 0.9);
        };
      };
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");
    setStatus("Iniciando escáner inteligente...");

    try {
      // 1. INTENTO NATIVO (EL MÁS RÁPIDO) 🚀
      try {
        setStatus("Probando Detector Nativo Android...");
        const nativeResult = await scanWithNativeAndroid(file);
        console.log("¡Leído con Android Nativo!");
        onScanSuccess(nativeResult);
        return; // Terminamos éxito rotundo
      } catch (nativeErr) {
        console.log("Fallo nativo, pasando a librería JS...", nativeErr);
      }

      // 2. INTENTO LIBRERÍA (CON REDIMENSIÓN) 🛠️
      setStatus("Analizando con motor secundario...");
      const resizedFile = await resizeImage(file);
      const html5QrCode = new Html5Qrcode("reader-hidden");
      
      try {
        const decodedText = await html5QrCode.scanFileV2(resizedFile, true);
        if (decodedText && decodedText.length > 15) {
            html5QrCode.clear();
            onScanSuccess(decodedText);
            return;
        }
      } catch (e) { console.log("Fallo redimensionado"); }

      // 3. INTENTO DESESPERADO (ORIGINAL) 🐢
      try {
         const originalText = await html5QrCode.scanFileV2(file, true);
         if (originalText && originalText.length > 15) {
             html5QrCode.clear();
             onScanSuccess(originalText);
             return;
         }
      } catch(e) {}

      throw new Error("Fallo total");

    } catch (err) {
      console.error("Error final:", err);
      setLoading(false);
      setErrorMsg("No se pudo leer. Asegúrate de usar FLASH y ZOOM 2x.");
      event.target.value = ''; 
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
          <Box sx={{ py: 5 }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Typography sx={{ mt: 2, color: '#fbbf24', fontWeight: 'bold' }}>{status}</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Procesando imagen...</Typography>
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

        {!loading && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 3 }}>
            <FlashOnIcon sx={{ color: '#fbbf24' }} />
            <Typography variant="caption" color="#cbd5e1" sx={{ alignSelf: 'center' }}>
               Usa <b>Flash</b> y <b>Zoom 2x</b>
            </Typography>
          </Box>
        )}

        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8', textDecoration: 'underline' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}