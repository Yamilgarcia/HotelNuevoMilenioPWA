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

  // Función heurística BLINDADA contra etiquetas y texto basura
  const parseTextoCedula = (text) => {
    // 1. Limpiamos las líneas
    const lineas = text.split('\n')
        .map(l => l.trim().toUpperCase())
        .filter(l => l.length > 2);
    
    console.log("Líneas detectadas por OCR:", lineas);

    let resultado = {
        cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: ''
    };

    // 2. Extraer Cédula (Se mantiene igual, funciona bien)
    const regexCedula = /\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]\b/;
    const matchCedula = text.toUpperCase().match(regexCedula);
    if (matchCedula) {
        let limpia = matchCedula[0].replace(/\s/g, '');
        if (limpia.length === 14) {
            limpia = `${limpia.substring(0,3)}-${limpia.substring(3,9)}-${limpia.substring(9)}`;
        }
        resultado.cedula = limpia;
    }

    // LISTA NEGRA: Estas palabras jamás deben guardarse como nombres o apellidos
    const listaNegra = /NOMBRES?|APELLIDOS?|FECHA|NACIMIENTO|LUGAR|SEXO|EMISION|EXPIRACION|DIRECTOR|CEDULA|IDENTIDAD/g;

    for (let i = 0; i < lineas.length; i++) {
        let linea = lineas[i];

        // --- BUSCAR NOMBRES ---
        if (linea.includes('NOMBRE') || linea.includes('N0MBRE') || linea.includes('NOMBR')) {
            // Borramos la palabra "NOMBRES" por si el OCR leyó etiqueta y nombre en la misma línea
            let textoExtraido = linea.replace(/NOMBRES?|N0MBRES?|NOMBR/g, '').trim();
            
            // Si la línea quedó casi vacía, el nombre real está en la línea de abajo
            if (textoExtraido.length < 3 && lineas[i + 1]) {
                textoExtraido = lineas[i + 1];
            }

            // MAGIA AQUÍ: Borramos cualquier palabra de la lista negra por si agarró "APELLIDOS" por error
            textoExtraido = textoExtraido.replace(listaNegra, '').trim();

            if (textoExtraido.length >= 3) {
                // Limpiamos caracteres raros y guardamos
                textoExtraido = textoExtraido.replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
                const partes = textoExtraido.split(' ');
                resultado.primerNombre = partes[0] || '';
                resultado.segundoNombre = partes.slice(1).join(' ') || '';
            }
        }

        // --- BUSCAR APELLIDOS ---
        if (linea.includes('APELLIDO') || linea.includes('PELLIDO') || linea.includes('APEL')) {
            // Borramos la palabra "APELLIDOS"
            let textoExtraido = linea.replace(/APELLIDOS?|PELLIDOS?|APEL/g, '').trim();
            
            // Si la línea quedó casi vacía, el apellido está en la línea de abajo
            if (textoExtraido.length < 3 && lineas[i + 1]) {
                textoExtraido = lineas[i + 1];
            }

            // Evitamos que guarde "FECHA DE NACIMIENTO" como apellido
            textoExtraido = textoExtraido.replace(listaNegra, '').trim();

            if (textoExtraido.length >= 3) {
                // Limpiamos y guardamos
                textoExtraido = textoExtraido.replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
                const partes = textoExtraido.split(' ');
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