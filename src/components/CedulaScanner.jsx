import React, { useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CachedIcon from '@mui/icons-material/Cached'; // Icono de rotación

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- FUNCIÓN DE PROCESAMIENTO DE IMAGEN (Redimensionar + Rotar) ---
  const processImageCanvas = (file, rotation = 0) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Reducimos a 1000px para velocidad
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
              if (width > maxDim) {
                  height *= maxDim / width;
                  width = maxDim;
              }
          } else {
              if (height > maxDim) {
                  width *= maxDim / height;
                  height = maxDim;
              }
          }

          // Configurar canvas según rotación
          if (rotation === 90 || rotation === 270) {
              canvas.width = height;
              canvas.height = width;
          } else {
              canvas.width = width;
              canvas.height = height;
          }

          // Aplicar rotación
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);

          // Convertir a escala de grises (Mejora contraste para PDF417)
          // Esto ayuda mucho si la foto tiene sombras
          /* const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // Rojo
            data[i + 1] = avg; // Verde
            data[i + 2] = avg; // Azul
          }
          ctx.putImageData(imgData, 0, 0);
          */

          canvas.toBlob((blob) => {
            resolve(new File([blob], "processed.jpg", { type: "image/jpeg" }));
          }, 'image/jpeg', 0.9);
        };
      };
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Limpiar input
    event.target.value = '';

    setLoading(true);
    setErrorMsg("");
    
    // Configuración específica para PDF417
    const html5QrCode = new Html5Qrcode("reader-hidden", {
        formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417 ] 
    });

    try {
        // --- ESTRATEGIA DE 4 ÁNGULOS ---
        const angles = [0, 90, 180, 270]; // Probar normal, vertical, invertido
        
        for (let angle of angles) {
            setStatus(angle === 0 ? "Analizando imagen..." : `Probando rotación ${angle}°...`);
            
            // 1. Preparar imagen girada
            const processedFile = await processImageCanvas(file, angle);
            
            try {
                // 2. Intentar leer
                const decodedText = await html5QrCode.scanFileV2(processedFile, true);
                if (decodedText && decodedText.length > 20) {
                    console.log(`¡Éxito rotundo en ángulo ${angle}°!`);
                    html5QrCode.clear();
                    onScanSuccess(decodedText);
                    return; // SALIR DE LA FUNCIÓN AL ENCONTRARLO
                }
            } catch (e) {
                console.log(`Fallo en ${angle}°, intentando siguiente...`);
            }
        }
        
        throw new Error("No se pudo leer en ninguna orientación.");

    } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMsg("No se pudo leer la cédula. Intenta acercarte un poco más o usar más luz.");
    }
  };

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">Escáner Inteligente</Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CachedIcon sx={{ animation: 'spin 2s linear infinite' }} />
                <Typography sx={{ color: '#fbbf24', fontWeight: 'bold' }}>{status}</Typography>
            </Box>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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

        {/* MOTOR OCULTO */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#94a3b8', textDecoration: 'underline' }}>
          Cancelar
        </Button>

      </CardContent>
    </Card>
  );
}