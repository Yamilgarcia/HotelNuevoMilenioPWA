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

 // Función heurística por "Acorralamiento de Texto" (Especial para Nicaragua)
  const parseTextoCedula = (text) => {
    let resultado = {
        cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: ''
    };

    // 1. Convertimos todo a un solo párrafo gigante y en mayúsculas (ignoramos los saltos de línea)
    const textoPlano = text.replace(/\n/g, ' ').toUpperCase();
    console.log("Texto plano leído:", textoPlano);

    // 2. Extraer Cédula (Esta parte es casi infalible)
    const regexCedula = /\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]\b/;
    const matchCedula = textoPlano.match(regexCedula);
    let inicioBloqueNombres = 0;

    if (matchCedula) {
        let limpia = matchCedula[0].replace(/\s/g, '');
        if (limpia.length === 14) {
            limpia = `${limpia.substring(0,3)}-${limpia.substring(3,9)}-${limpia.substring(9)}`;
        }
        resultado.cedula = limpia;
        // Marcamos dónde termina la cédula para empezar a buscar nombres desde ahí
        inicioBloqueNombres = textoPlano.indexOf(matchCedula[0]) + matchCedula[0].length;
    }

    // 3. ACORRALAR LA ZONA DE NOMBRES
    // Cortamos la basura de arriba (todo lo que está antes de la cédula)
    let zonaNombres = textoPlano.substring(inicioBloqueNombres);

    // Cortamos la basura de abajo (todo lo que está después de "FECHA" o un formato de fecha 00-00-0000)
    const matchFin = zonaNombres.match(/FECHA|LUGAR|NACIMIENTO|\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
    if (matchFin) {
        // Nos quedamos SOLO con lo que está entre la cédula y la fecha
        zonaNombres = zonaNombres.substring(0, matchFin.index);
    }

    // En este punto, 'zonaNombres' debería ser algo como: " NOMBRES JOSE YAMIL APELLIDOS GARCIA ROMERO "

    // 4. PARTIR EL BLOQUE EN DOS (Usando la palabra "APELLIDOS" como cuchillo)
    const regexSeparador = /APELLIDOS?|PELLIDOS?|APEL|APELL1DOS?/;
    const partes = zonaNombres.split(regexSeparador);

    let nombresRaw = partes[0] || "";
    let apellidosRaw = partes.length > 1 ? partes[1] : "";

    // 5. LIMPIAR Y ASIGNAR NOMBRES
    // Le arrancamos la etiqueta "NOMBRES" y cualquier símbolo raro
    nombresRaw = nombresRaw.replace(/NOMBRES?|N0MBRES?|NOMBR/g, '').replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
    const arrayNombres = nombresRaw.split(' ');
    
    if (arrayNombres.length > 0 && arrayNombres[0] !== "") {
        resultado.primerNombre = arrayNombres[0];
        // Si hay más de un nombre, los une todos en el segundo campo
        resultado.segundoNombre = arrayNombres.slice(1).join(' '); 
    }

    // 6. LIMPIAR Y ASIGNAR APELLIDOS
    apellidosRaw = apellidosRaw.replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
    const arrayApellidos = apellidosRaw.split(' ');
    
    if (arrayApellidos.length > 0 && arrayApellidos[0] !== "") {
        resultado.primerApellido = arrayApellidos[0];
        resultado.segundoApellido = arrayApellidos.slice(1).join(' ');
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