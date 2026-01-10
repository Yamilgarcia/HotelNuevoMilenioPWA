import React, { useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode"; // Usamos el motor principal
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FileUploadIcon from '@mui/icons-material/FileUpload';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setMensaje("Analizando la foto... (Esto puede tomar unos segundos)");

    try {
      // Usamos el motor de Html5Qrcode para analizar el archivo
      const html5QrCode = new Html5Qrcode("reader-hidden");
      
      // Esta función es la clave: analiza la imagen con alta precisión
      const decodedText = await html5QrCode.scanFileV2(file, true);
      
      if (decodedText && decodedText.length > 15) {
         // ¡ÉXITO!
         onScanSuccess(decodedText);
      } else {
         alert("Lectura fallida. El código no se pudo leer completo.");
         setLoading(false);
         setMensaje("");
      }

    } catch (err) {
      console.error("Error de lectura:", err);
      alert("⚠️ No se pudo leer el código PDF417 en la foto.\n\nCONSEJOS PARA SAMSUNG:\n\n1. ¡Usa el FLASH!\n2. Usa Zoom 2x para enfocar bien\n3. Asegura que la foto no esté movida.");
      setLoading(false);
      setMensaje("");
    }
  };

  return (
    <Box sx={{ 
      textAlign: 'center', p: 3, bgcolor: '#1e293b', color: 'white', borderRadius: 2,
      display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center'
    }}>
      
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Escáner por Foto (Alta Precisión)
      </Typography>

      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
        Toma una foto clara y con flash del código trasero.
      </Typography>

      {/* Input oculto para la cámara nativa */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Div oculto necesario para la librería */}
      <div id="reader-hidden" style={{ display: 'none' }}></div>

      {loading ? (
        <Box sx={{ py: 4 }}>
          <CircularProgress color="success" />
          <Typography sx={{ mt: 2, color: '#fbbf24' }}>{mensaje}</Typography>
        </Box>
      ) : (
        <>
           {/* BOTÓN PRINCIPAL */}
           <Button 
             variant="contained" 
             color="success" 
             size="large"
             startIcon={<CameraAltIcon />}
             onClick={() => fileInputRef.current.click()}
             sx={{ 
               py: 2, px: 4, 
               fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', width: '100%',
               background: 'linear-gradient(45deg, #10b981 30%, #059669 90%)'
             }}
           >
             ABRIR CÁMARA NATIVA
           </Button>

           <Button 
             variant="text" 
             color="inherit" 
             startIcon={<FileUploadIcon />}
             onClick={() => {
                fileInputRef.current.removeAttribute('capture'); 
                fileInputRef.current.click();
             }}
             sx={{ opacity: 0.7 }}
           >
             O subir de Galería
           </Button>
        </>
      )}

      <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 2, borderRadius: 1, mt: 1, textAlign: 'left' }}>
        <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', fontWeight: 'bold', mb: 0.5 }}>
          ✅ CLAVES PARA EL ÉXITO:
        </Typography>
        <Typography variant="caption" sx={{ color: '#eee', display: 'block' }}>
          📸 <b>Usa Flash:</b> Es obligatorio para ver los puntos.
        </Typography>
        <Typography variant="caption" sx={{ color: '#eee', display: 'block' }}>
          🔍 <b>Zoom 2x:</b> Aléjate 20cm y haz zoom.
        </Typography>
        <Typography variant="caption" sx={{ color: '#eee', display: 'block' }}>
          🎯 <b>Enfoque:</b> Toca la pantalla en el código para enfocar.
        </Typography>
      </Box>

      <Button onClick={onClose} variant="outlined" color="error" fullWidth sx={{ mt: 1 }}>
        Cancelar
      </Button>
    </Box>
  );
}