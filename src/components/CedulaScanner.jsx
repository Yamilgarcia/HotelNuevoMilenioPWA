import React, { useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // --- PROCESAMIENTO DE IMAGEN (Mejora para PDF417) ---
  const preprocessImage = (file, rotation = 0) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // RESOLUCIÓN ALTA: Mantenemos hasta 2500px para no perder detalle de los puntos
          const maxDim = 2500; 
          let width = img.width;
          let height = img.height;
          
          // Escalar proporcionalmente si es gigante
          if (width > maxDim || height > maxDim) {
             const scale = maxDim / Math.max(width, height);
             width *= scale;
             height *= scale;
          }

          // Ajustar dimensiones según rotación
          if (rotation === 90 || rotation === 270) {
              canvas.width = height;
              canvas.height = width;
          } else {
              canvas.width = width;
              canvas.height = height;
          }

          // Rellenar fondo blanco (por si hay transparencia)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Rotar y Dibujar
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);

          // FILTRO DE ALTO CONTRASTE (Binarización simple)
          // Esto ayuda al lector JS a ver "Puntos Negros" sobre "Fondo Blanco"
          try {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;
              for (let i = 0; i < data.length; i += 4) {
                  // Convertir a escala de grises
                  const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                  // Binarizar (Todo lo que no sea muy oscuro se vuelve blanco puro)
                  const threshold = 100; // Umbral agresivo
                  const value = avg < threshold ? 0 : 255;
                  data[i] = value;     // R
                  data[i + 1] = value; // G
                  data[i + 2] = value; // B
              }
              ctx.putImageData(imgData, 0, 0);
          } catch (e) { console.warn("No se pudo aplicar filtro de contraste", e); }

          // Exportar con máxima calidad
          canvas.toBlob((blob) => {
            resolve(new File([blob], "processed.jpg", { type: "image/jpeg" }));
          }, 'image/jpeg', 1.0);
        };
      };
    });
  };

  const handleFileChange = async (event) => {
    const originalFile = event.target.files[0];
    if (!originalFile) return;
    event.target.value = ''; // Limpiar input
    
    setLoading(true);
    setErrorMsg("");

    // 1. INTENTO NATIVO (EL MÁS POTENTE) 🚀
    // Usamos el chip de Android directamente sobre el archivo original
    if ('BarcodeDetector' in window) {
        try {
            setStatus("Analizando con Android Nativo...");
            const formats = await window.BarcodeDetector.getSupportedFormats();
            if (formats.includes('pdf417')) {
                const detector = new window.BarcodeDetector({ formats: ['pdf417'] });
                const bitmap = await createImageBitmap(originalFile);
                const barcodes = await detector.detect(bitmap);
                
                // Buscar el código largo
                const validCode = barcodes.find(c => c.rawValue.length > 20);
                if (validCode) {
                    onScanSuccess(validCode.rawValue);
                    return; // ¡ÉXITO INMEDIATO!
                }
            }
        } catch (e) {
            console.log("Fallo nativo:", e);
        }
    }

    // 2. INTENTO MOTOR JS (FALLBACK CON ROTACIÓN) 🛠️
    const html5QrCode = new Html5Qrcode("reader-hidden", {
        formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417 ],
        verbose: false
    });

    // Probamos normal (0°) y vertical (90°)
    const angles = [0, 90, 270];

    for (let angle of angles) {
        setStatus(angle === 0 ? "Procesando imagen..." : `Probando rotación ${angle}°...`);
        
        try {
            // Procesamos con ALTA RESOLUCIÓN y CONTRASTE
            const processedFile = await preprocessImage(originalFile, angle);
            
            const decodedText = await html5QrCode.scanFileV2(processedFile, true);
            if (decodedText && decodedText.length > 20) {
                html5QrCode.clear();
                onScanSuccess(decodedText);
                return; // ¡ÉXITO!
            }
        } catch (err) {
            console.log(`Intento ${angle}° fallido.`);
        }
    }

    setLoading(false);
    setErrorMsg("No se pudo leer. Intenta acercar más la cámara al código.");
  };

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', bgcolor: '#1e293b', color: 'white' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: 1 }}>
            Escáner Pro
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress size={70} sx={{ color: '#4ade80' }} thickness={4} />
                <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AutoFixHighIcon sx={{ color: 'white', opacity: 0.8 }} />
                </Box>
            </Box>
            <Typography sx={{ mt: 3, color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {status}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                Aplicando filtro de contraste...
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                
                {/* BOTÓN GIGANTE */}
                <Button
                    onClick={() => cameraInputRef.current.click()}
                    sx={{
                        width: 180, height: 180, borderRadius: '50%',
                        background: 'linear-gradient(145deg, #334155, #1e293b)',
                        border: '4px solid #4ade80',
                        boxShadow: '0 0 30px rgba(74, 222, 128, 0.2)',
                        display: 'flex', flexDirection: 'column', gap: 1,
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 40px rgba(74, 222, 128, 0.4)' },
                        textTransform: 'none'
                    }}
                >
                    <CameraAltIcon sx={{ fontSize: 50, color: '#fff' }} />
                    <Typography variant="h6" fontWeight="bold" color="white">TOMAR FOTO</Typography>
                </Button>

                {/* BOTÓN GALERÍA */}
                <Button 
                    onClick={() => galleryInputRef.current.click()}
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    size="large"
                    sx={{ 
                        color: 'white', borderColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: 3, px: 4, py: 1.5, width: '100%',
                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    Subir desde Galería
                </Button>
            </Box>

            {errorMsg && (
              <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', borderRadius: 2, border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                <Typography color="#fca5a5" variant="body2" fontWeight="bold">❌ {errorMsg}</Typography>
              </Box>
            )}
          </>
        )}

        {!loading && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 3 }}>
            <FlashOnIcon sx={{ color: '#fbbf24' }} />
            <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" display="block" color="#e2e8f0" fontWeight="bold">RECOMENDACIÓN:</Typography>
                <Typography variant="caption" color="#94a3b8">Usa Flash y <b>acércate</b> para que el código llene la foto.</Typography>
            </Box>
          </Box>
        )}

        {/* INPUTS OCULTOS */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <div id="reader-hidden" style={{ display: 'none' }}></div>
        <Button onClick={onClose} variant="text" color="inherit" sx={{ mt: 3, color: '#64748b' }}>Cerrar</Button>

      </CardContent>
    </Card>
  );
}