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
  // Función heurística MEJORADA para sacar los datos del texto bruto
  const parseTextoCedula = (text) => {
    // 1. Limpiamos las líneas: quitamos espacios extra, pasamos a mayúsculas 
    // y filtramos líneas con basura o muy cortas (menos de 3 letras)
    const lineas = text.split('\n')
        .map(l => l.trim().toUpperCase())
        .filter(l => l.length > 2);
    
    // Imprimir en consola para que veas exactamente qué está leyendo la cámara
    console.log("Líneas detectadas por OCR:", lineas);

    let resultado = {
        cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: ''
    };

    // 2. Extraer Cédula (Buscamos patrón nica: 000-000000-0000X)
    const regexCedula = /\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]\b/;
    const matchCedula = text.toUpperCase().match(regexCedula);
    
    if (matchCedula) {
        let limpia = matchCedula[0].replace(/\s/g, '');
        if (limpia.length === 14) {
            limpia = `${limpia.substring(0,3)}-${limpia.substring(3,9)}-${limpia.substring(9)}`;
        }
        resultado.cedula = limpia;
    }

    // 3. Búsqueda Difusa de Nombres y Apellidos
    for (let i = 0; i < lineas.length; i++) {
        const lineaActual = lineas[i];

        // Buscar etiqueta de NOMBRES (tolerando errores comunes de OCR)
        // Coincide con: NOMBRES, N0MBRES, OMBRES, NOMB, etc.
        if (/(N[O0]MB|OMBR|N0MB)/.test(lineaActual)) {
            if (lineas[i + 1]) {
                // Limpiamos la siguiente línea para que solo queden letras y espacios (quitamos números o símbolos basura)
                const textoNombres = lineas[i + 1].replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
                const partesNombres = textoNombres.split(' ');
                
                if (partesNombres.length > 0 && textoNombres.length > 2) {
                    resultado.primerNombre = partesNombres[0] || '';
                    resultado.segundoNombre = partesNombres.slice(1).join(' ') || '';
                }
            }
        }

        // Buscar etiqueta de APELLIDOS (tolerando errores)
        // Coincide con: APELLIDOS, APEL, PELL, APELL1D0S
        if (/(APEL|PELL|AP[EÉ]LL)/.test(lineaActual)) {
            if (lineas[i + 1]) {
                const textoApellidos = lineas[i + 1].replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
                const partesApellidos = textoApellidos.split(' ');
                
                if (partesApellidos.length > 0 && textoApellidos.length > 2) {
                    resultado.primerApellido = partesApellidos[0] || '';
                    resultado.segundoApellido = partesApellidos.slice(1).join(' ') || '';
                }
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