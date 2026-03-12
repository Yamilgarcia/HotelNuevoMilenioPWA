import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import Tesseract from 'tesseract.js';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import './CedulaScanner.css';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Apunta al frente de la cédula");

  // Iniciar la cámara al montar el componente
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accediendo a la cámara:", err);
        setStatus("Error: No se pudo acceder a la cámara.");
      }
    };

    startCamera();

    // Limpieza al desmontar
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureAndRead = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    
    setIsProcessing(true);
    setStatus("Capturando y analizando texto...");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ajustar canvas al tamaño del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Obtener imagen en base64
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      // Tesseract.js para extraer texto (Idioma Español)
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'spa',
        { logger: m => console.log(m) } // Puedes ver el progreso en consola
      );

      console.log("Texto extraído:", text);
      const datosProcesados = parseTextoCedula(text);
      
      if (datosProcesados.cedula) {
          onScanSuccess(datosProcesados);
      } else {
          setStatus("No se detectó una cédula válida. Intenta de nuevo.");
          setIsProcessing(false);
      }

    } catch (error) {
      console.error("Error en OCR:", error);
      setStatus("Error al analizar la imagen.");
      setIsProcessing(false);
    }
  };

  // Función heurística para sacar los datos del texto bruto
  const parseTextoCedula = (text) => {
    const lineas = text.split('\n').map(l => l.trim().toUpperCase()).filter(l => l.length > 0);
    
    let resultado = {
        cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: ''
    };

    // 1. Extraer Cédula (Buscamos patrón nica: 000-000000-0000X)
    // Se contemplan posibles errores de lectura donde falte un guión o haya espacios
    const regexCedula = /\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]\b/;
    const matchCedula = text.toUpperCase().match(regexCedula);
    
    if (matchCedula) {
        // Limpiamos y formateamos correctamente a 000-000000-0000X
        let limpia = matchCedula[0].replace(/\s/g, '');
        if (limpia.length === 14) {
            limpia = `${limpia.substring(0,3)}-${limpia.substring(3,9)}-${limpia.substring(9)}`;
        }
        resultado.cedula = limpia;
    }

    // 2. Extraer Nombres y Apellidos (Heurística básica basada en estructura típica)
    for (let i = 0; i < lineas.length; i++) {
        // Si la línea dice "APELLIDOS", asumimos que la siguiente línea tiene los apellidos
        if (lineas[i].includes('APELLIDOS') && lineas[i+1]) {
            const apellidos = lineas[i+1].split(' ').filter(w => w.length > 1);
            resultado.primerApellido = apellidos[0] || '';
            resultado.segundoApellido = apellidos.slice(1).join(' ') || '';
        }
        // Si la línea dice "NOMBRES", la siguiente tiene los nombres
        if (lineas[i].includes('NOMBRES') && lineas[i+1]) {
            const nombres = lineas[i+1].split(' ').filter(w => w.length > 1);
            resultado.primerNombre = nombres[0] || '';
            resultado.segundoNombre = nombres.slice(1).join(' ') || '';
        }
    }

    return resultado;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '400px', bgcolor: '#000', borderRadius: 2, overflow: 'hidden' }}>
      
      {/* Video stream */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      {/* Canvas oculto para capturar la imagen */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Overlay UI */}
      <Box className="scanner-overlay">
        <Box className="scanner-box-ocr">
            {/* Guía visual */}
        </Box>
        
        <Typography variant="body2" sx={{ color: 'white', mt: 2, bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 1, borderRadius: 1 }}>
            {status}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
                variant="contained" 
                color="error" 
                onClick={onClose}
                disabled={isProcessing}
            >
                Cancelar
            </Button>
            <Button 
                variant="contained" 
                color="success" 
                onClick={captureAndRead}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
            >
                {isProcessing ? 'Procesando...' : 'Escanear'}
            </Button>
        </Box>
      </Box>
    </Box>
  );
}