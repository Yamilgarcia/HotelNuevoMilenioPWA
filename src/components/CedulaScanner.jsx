import React, { useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { Box, Typography, Button, CircularProgress, Card, CardContent } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  // Esta función se ejecuta cuando tomas la foto y le das "Aceptar"
  const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  setLoading(true);
  setErrorMsg("");

  const html5QrCode = new Html5Qrcode("reader-hidden");

  try {
    // Cargar imagen en memoria
    const img = new Image();
    img.src = URL.createObjectURL(file);

    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    // Crear canvas HD
    const canvas = document.createElement("canvas");
    const scale = 2; // 🔥 clave para PDF417
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convertir canvas a archivo
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/png")
    );

    const processedFile = new File([blob], "scan.png", {
      type: "image/png"
    });

    // Escanear imagen PROCESADA
    const result = await html5QrCode.scanFile(processedFile, false);

    if (result && result.length > 15) {
      await html5QrCode.clear();
      onScanSuccess(result);
    } else {
      throw new Error("Lectura inválida");
    }

  } catch (err) {
    console.error("Error escaneo:", err);
    setErrorMsg("No se pudo leer la cédula. Toma la foto más cerca.");
    setLoading(false);
    event.target.value = '';
  }
};


  const triggerCamera = () => {
    fileInputRef.current.click();
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
            <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 4 }}>
              Toma una foto clara de la parte trasera de la cédula.
            </Typography>

            {/* BOTÓN GIGANTE DE CÁMARA */}
            <Button
              onClick={triggerCamera}
              variant="contained"
              sx={{
                width: 180, height: 180, borderRadius: '50%',
                bgcolor: '#334155', 
                border: '4px solid #4ade80',
                display: 'flex', flexDirection: 'column', gap: 1,
                transition: 'transform 0.2s',
                '&:hover': { bgcolor: '#475569', transform: 'scale(1.05)' },
                boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)'
              }}
            >
              <CameraAltIcon sx={{ fontSize: 60, color: '#fff' }} />
              <Typography variant="button" fontWeight="bold">TOMAR FOTO</Typography>
            </Button>

            {/* MENSAJE DE ERROR SI FALLA */}
            {errorMsg && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.2)', borderRadius: 2, border: '1px solid #ef4444' }}>
                <Typography color="#fca5a5" variant="body2" fontWeight="bold">
                  ❌ {errorMsg}
                </Typography>
                <Typography color="#fca5a5" variant="caption">
                  Asegúrate de usar flash y enfocar bien.
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

        {/* INPUT OCULTO (El motor real) */}
        <input
          type="file"
          accept="image/*"
          capture="environment" // Esto obliga a usar la cámara trasera nativa
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* ELEMENTO HTML NECESARIO PARA LA LIBRERÍA (INVISIBLE) */}
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