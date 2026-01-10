import React, { useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'; // Icono para galería

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Usamos dos referencias diferentes para controlar los dos comportamientos
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Función común para procesar la imagen (venga de cámara o galería)
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");

      // Analizamos la foto con máxima precisión
      const decodedText = await html5QrCode.scanFileV2(file, true);

      if (decodedText && decodedText.length > 15) {
        html5QrCode.clear();
        onScanSuccess(decodedText);
      } else {
        throw new Error("Lectura corta");
      }

    } catch (err) {
      console.error("Error escaneo:", err);
      setLoading(false);
      setErrorMsg("No se pudo leer el código PDF417. Intenta de nuevo.");
      event.target.value = ''; // Limpiar input para permitir reintentos
    }
  };

  return (
    <Card sx={{ 
      maxWidth: 500, margin: '0 auto', borderRadius: 4, 
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', bgcolor: '#1e293b', color: 'white' 
    }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        
        {/* ENCABEZADO */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CreditCardIcon sx={{ color: '#4ade80', fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold">
            Escáner de Cédula
          </Typography>
        </Box>

        {/* ÁREA PRINCIPAL */}
        {loading ? (
          <Box sx={{ py: 5 }}>
            <CircularProgress size={60} sx={{ color: '#4ade80' }} />
            <Typography sx={{ mt: 2, color: '#94a3b8' }}>Procesando imagen...</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
              Elige cómo quieres escanear la cédula:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                
                {/* OPCIÓN 1: CÁMARA (BOTÓN GIGANTE) */}
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
                        boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)'
                    }}
                >
                    <CameraAltIcon sx={{ fontSize: 50, color: '#fff' }} />
                    <Typography variant="button" fontWeight="bold">TOMAR FOTO</Typography>
                </Button>

                {/* OPCIÓN 2: GALERÍA (BOTÓN SECUNDARIO) */}
                <Button 
                    onClick={() => galleryInputRef.current.click()}
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    sx={{ 
                        color: 'white', borderColor: 'rgba(255,255,255,0.3)', 
                        borderRadius: 3, px: 3, py: 1,
                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    Subir desde Galería
                </Button>
            </Box>

            {/* MENSAJE DE ERROR */}
            {errorMsg && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.2)', borderRadius: 2, border: '1px solid #ef4444' }}>
                <Typography color="#fca5a5" variant="body2" fontWeight="bold">
                  ❌ {errorMsg}
                </Typography>
                <Typography color="#fca5a5" variant="caption">
                  Asegúrate de que la foto tenga buena luz y se vea el código completo.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* TIPS VISUALES */}
        {!loading && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-around', bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FlashOnIcon sx={{ color: '#fbbf24' }} />
              <Typography variant="caption" color="#cbd5e1">Usa Flash</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <CenterFocusStrongIcon sx={{ color: '#38bdf8' }} />
               <Typography variant="caption" color="#cbd5e1">Enfoca Bien</Typography>
            </Box>
          </Box>
        )}

        {/* --- INPUTS OCULTOS --- */}
        
        {/* Input 1: Fuerza la CÁMARA TRASERA */}
        <input
          type="file"
          accept="image/*"
          capture="environment" 
          ref={cameraInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Input 2: Permite GALERÍA (Sin atributo capture) */}
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* MOTOR INVISIBLE */}
        <div id="reader-hidden" style={{ display: 'none' }}></div>

        {/* BOTÓN CANCELAR */}
        <Button 
          onClick={onClose} 
          variant="text" 
          color="inherit" 
          sx={{ mt: 3, color: '#94a3b8', textDecoration: 'underline' }}
        >
          Cancelar operación
        </Button>

      </CardContent>
    </Card>
  );
}