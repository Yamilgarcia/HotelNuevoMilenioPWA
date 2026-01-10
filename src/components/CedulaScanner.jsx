import React, { useState, useRef } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FileUploadIcon from '@mui/icons-material/FileUpload';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      // 1. Crear URL temporal de la imagen
      const imageUrl = URL.createObjectURL(file);
      
      // 2. Usar el lector para analizar la FOTO estática
      const reader = new BrowserPDF417Reader();
      
      // Intentamos leer el código de la imagen
      const result = await reader.decodeFromImageUrl(imageUrl);
      
      if (result) {
        const text = result.getText();
        if (text.length > 15) {
             onScanSuccess(text); // ¡Éxito!
        } else {
             alert("Código ilegible o muy corto. Intenta tomar la foto más cerca.");
             setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      alert("No se encontró el código PDF417 en la foto.\n\nTips:\n1. Usa FLASH\n2. Enfoca bien el cuadro denso\n3. Que la foto no salga borrosa");
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      textAlign: 'center', p: 3, bgcolor: '#1e293b', color: 'white', borderRadius: 2,
      display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center'
    }}>
      
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Escáner por Foto
      </Typography>

      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
        Usa la cámara de tu celular para tomar una foto clara de la parte trasera.
      </Typography>

      {/* Input oculto que activa la cámara nativa */}
      <input
        type="file"
        accept="image/*"
        capture="environment" // Esto fuerza a abrir la cámara trasera
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {loading ? (
        <Box sx={{ py: 4 }}>
          <CircularProgress color="success" />
          <Typography sx={{ mt: 2 }}>Analizando foto...</Typography>
        </Box>
      ) : (
        <>
           {/* BOTÓN GRANDE PARA ABRIR CÁMARA */}
           <Button 
             variant="contained" 
             color="success" 
             size="large"
             startIcon={<CameraAltIcon />}
             onClick={() => fileInputRef.current.click()}
             sx={{ 
               py: 2, px: 4, 
               fontSize: '1.1rem', 
               fontWeight: 'bold',
               borderRadius: '12px',
               width: '100%'
             }}
           >
             ABRIR CÁMARA
           </Button>

           {/* Opción secundaria por si tienen la foto en galería */}
           <Button 
             variant="text" 
             color="inherit" 
             startIcon={<FileUploadIcon />}
             onClick={() => {
                // Quitamos el atributo capture para permitir galería
                fileInputRef.current.removeAttribute('capture'); 
                fileInputRef.current.click();
             }}
             sx={{ opacity: 0.7 }}
           >
             Subir desde Galería
           </Button>
        </>
      )}

      <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 2, borderRadius: 1, mt: 1, textAlign: 'left' }}>
        <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', fontWeight: 'bold' }}>
          💡 RECOMENDACIÓN SAMSUNG:
        </Typography>
        <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
          • Al abrir la cámara, usa el **Zoom 2x**.
        </Typography>
        <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
          • Activa el **Flash** para que se vean bien los puntos.
        </Typography>
      </Box>

      <Button onClick={onClose} variant="outlined" color="error" fullWidth sx={{ mt: 1 }}>
        Cancelar
      </Button>
    </Box>
  );
}