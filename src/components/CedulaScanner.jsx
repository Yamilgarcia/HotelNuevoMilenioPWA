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

  // Función heurística adaptada EXACTAMENTE a la cédula nicaragüense
  const parseTextoCedula = (text) => {
    // 1. Separamos por líneas, limpiamos espacios y pasamos todo a mayúsculas
    const lineas = text.split('\n')
        .map(l => l.trim().toUpperCase())
        .filter(l => l.length > 2); // Ignoramos líneas vacías o de 1-2 letras (basura visual)
    
    console.log("Líneas detectadas por OCR:", lineas);

    let resultado = {
        cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: ''
    };

    // 2. Extraer Cédula (La parte que ya funcionaba bien)
    const regexCedula = /\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]\b/;
    const matchCedula = text.toUpperCase().match(regexCedula);
    
    if (matchCedula) {
        let limpia = matchCedula[0].replace(/\s/g, '');
        if (limpia.length === 14) {
            limpia = `${limpia.substring(0,3)}-${limpia.substring(3,9)}-${limpia.substring(9)}`;
        }
        resultado.cedula = limpia;
    }

    // 3. Extraer Nombres y Apellidos (Estrategia adaptada a la foto)
    for (let i = 0; i < lineas.length; i++) {
        let linea = lineas[i];

        // --- BÚSQUEDA DE NOMBRES ---
        // Buscamos la palabra "NOMBRES" o variaciones por mala lectura
        if (linea.includes('NOMBRE') || linea.includes('N0MBRE') || linea.includes('NOMBR')) {
            let textoNombres = "";
            
            // Caso A: El OCR leyó "Nombres JUAN PEREZ" en la misma línea
            let nombresLimpios = linea.replace(/N[O0]MBRES?/, '').trim();
            if (nombresLimpios.length > 3) {
                textoNombres = nombresLimpios;
            } 
            // Caso B (Lo más normal): El OCR leyó "Nombres" en una línea y "JUAN PEREZ" en la siguiente
            else if (lineas[i + 1]) {
                textoNombres = lineas[i + 1];
            }

            // Limpiamos la basura visual (dejamos solo letras y espacios)
            textoNombres = textoNombres.replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
            const partes = textoNombres.split(' ');
            
            if (partes.length > 0) {
                resultado.primerNombre = partes[0] || '';
                resultado.segundoNombre = partes.slice(1).join(' ') || '';
            }
        }

        // --- BÚSQUEDA DE APELLIDOS ---
        // Buscamos "APELLIDOS", "APELL1DOS", etc.
        if (linea.includes('APELLIDO') || linea.includes('PELLIDO') || linea.includes('APEL')) {
            let textoApellidos = "";
            
            // Caso A: Leyó todo en una línea
            let apellidosLimpios = linea.replace(/APELLIDOS?|PELLIDOS?|APELL1DOS?/, '').trim();
            if (apellidosLimpios.length > 3) {
                textoApellidos = apellidosLimpios;
            } 
            // Caso B: Leyó el dato en la línea de abajo (como se ve en la foto)
            else if (lineas[i + 1]) {
                textoApellidos = lineas[i + 1];
            }

            // Limpiamos basura visual
            textoApellidos = textoApellidos.replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
            const partes = textoApellidos.split(' ');
            
            if (partes.length > 0) {
                resultado.primerApellido = partes[0] || '';
                resultado.segundoApellido = partes.slice(1).join(' ') || '';
            }
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