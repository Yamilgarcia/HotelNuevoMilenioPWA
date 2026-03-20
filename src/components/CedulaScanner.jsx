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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'spa',
        { logger: m => console.log(m) }
      );

      console.log("Texto bruto extraído:", text);
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

  // Función heurística por "Acorralamiento de Texto"
  const parseTextoCedula = (text) => {
    let resultado = {
        cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: ''
    };

    const textoPlano = text.replace(/\n/g, ' ').toUpperCase();
    console.log("Texto en bloque:", textoPlano);

    // 1. Extraer Cédula
    const regexCedula = /\b\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]\b/;
    const matchCedula = textoPlano.match(regexCedula);
    let inicioBloqueNombres = 0;

    if (matchCedula) {
        let limpia = matchCedula[0].replace(/\s/g, '');
        if (limpia.length === 14) {
            limpia = `${limpia.substring(0,3)}-${limpia.substring(3,9)}-${limpia.substring(9)}`;
        }
        resultado.cedula = limpia;
        inicioBloqueNombres = textoPlano.indexOf(matchCedula[0]) + matchCedula[0].length;
    }

    // 2. Acorralar la zona útil (Entre la cédula y la fecha de nacimiento)
    let zonaNombres = textoPlano.substring(inicioBloqueNombres);
    const matchFin = zonaNombres.match(/FECHA|LUGAR|NACIMIENTO|\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
    if (matchFin) {
        zonaNombres = zonaNombres.substring(0, matchFin.index);
    }

    // 3. Partir Nombres y Apellidos
    const regexSeparador = /APELLIDOS?|PELLIDOS?|APEL|APELL1DOS?/;
    const partes = zonaNombres.split(regexSeparador);

    let nombresRaw = partes[0] || "";
    let apellidosRaw = partes.length > 1 ? partes[1] : "";

    // 4. Asignar Nombres
    nombresRaw = nombresRaw.replace(/NOMBRES?|N0MBRES?|NOMBR/g, '').replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
    const arrayNombres = nombresRaw.split(' ');
    if (arrayNombres.length > 0 && arrayNombres[0] !== "") {
        resultado.primerNombre = arrayNombres[0];
        resultado.segundoNombre = arrayNombres.slice(1).join(' '); 
    }

    // 5. Asignar Apellidos
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
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Box className="scanner-overlay">
        <Box className="scanner-box-ocr"></Box>
        <Typography variant="body2" sx={{ color: 'white', mt: 2, bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 1, borderRadius: 1 }}>
            {status}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="contained" color="error" onClick={onClose} disabled={isProcessing}>
                Cancelar
            </Button>
            <Button 
                variant="contained" color="success" onClick={captureAndRead} disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
            >
                {isProcessing ? 'Procesando...' : 'Escanear'}
            </Button>
        </Box>
      </Box>
    </Box>
  );
}