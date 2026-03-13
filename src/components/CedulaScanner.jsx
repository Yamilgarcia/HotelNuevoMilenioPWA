import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import './CedulaScanner.css';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Apunta al frente de la cédula y evita reflejos");

  // Iniciar la cámara
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accediendo a la cámara:", err);
        setStatus("Error: No se pudo acceder a la cámara.");
      }
    };
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 1. Tomar la foto y mostrar la vista previa (No cobra nada)
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Guardamos la imagen en base64 para mostrarla
    const base64Image = canvas.toDataURL('image/jpeg', 0.8); // 0.8 comprime un poco para mayor velocidad
    setCapturedImage(base64Image);
    setStatus("¿La foto es nítida y se leen bien los datos?");
  };

  // 2. Descartar foto y volver a la cámara
  const retakePhoto = () => {
    setCapturedImage(null);
    setStatus("Apunta al frente de la cédula y evita reflejos");
  };

  // 3. Enviar a Google Vision API (ESTO CONSUME 1 ESCANEO)
  // 3. Enviar a Google Vision API (VERSIÓN CON DEBUG)
  const analyzeWithGoogleVision = async () => {
    setIsProcessing(true);
    setStatus("Consultando con la IA en la nube...");

    try {
      const base64Data = capturedImage.split(',')[1];
      const API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY; 

      // Trampa 1: Verificar si Vite realmente cargó la clave
      if (!API_KEY) {
          setStatus("Error: Vite no está leyendo tu clave API del archivo .env");
          setIsProcessing(false);
          return;
      }

      const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
            }
          ]
        })
      });

      const result = await response.json();
      
      // Trampa 2: Capturar el error EXACTO que nos devuelve Google Cloud
      if (result.error) {
          setStatus(`Google dice: ${result.error.message}`);
          setIsProcessing(false);
          return;
      }

      // Si todo sale bien, procesamos el texto
      const fullText = result.responses?.[0]?.fullTextAnnotation?.text || "";

      if (!fullText) {
        setStatus("Google no encontró texto. Intenta de nuevo.");
        setIsProcessing(false);
        return;
      }

      const datosProcesados = parseTextoGoogle(fullText);
      
      if (datosProcesados.cedula) {
          onScanSuccess(datosProcesados);
      } else {
          setStatus("Se leyó el texto pero no se reconoció la cédula.");
          setIsProcessing(false);
      }

    } catch (error) {
      // Trampa 3: Si el código falla por otra cosa, muestra el error de JavaScript
      setStatus(`Error técnico: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Lógica de acorralamiento adaptada a la limpieza de Google Vision
  const parseTextoGoogle = (text) => {
    let resultado = { cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
    const textoPlano = text.replace(/\n/g, ' ').toUpperCase();

    // Extraer Cédula
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

    // Acorralar y extraer Nombres y Apellidos
    let zonaNombres = textoPlano.substring(inicioBloqueNombres);
    const matchFin = zonaNombres.match(/FECHA|LUGAR|NACIMIENTO|\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
    if (matchFin) zonaNombres = zonaNombres.substring(0, matchFin.index);

    const regexSeparador = /APELLIDOS?|PELLIDOS?|APEL|APELL1DOS?/;
    const partes = zonaNombres.split(regexSeparador);

    let nombresRaw = partes[0] || "";
    let apellidosRaw = partes.length > 1 ? partes[1] : "";

    nombresRaw = nombresRaw.replace(/NOMBRES?|N0MBRES?|NOMBR/g, '').replace(/[^A-ZÑ\s]/g, '').trim().replace(/\s+/g, ' ');
    const arrayNombres = nombresRaw.split(' ');
    if (arrayNombres.length > 0 && arrayNombres[0] !== "") {
        resultado.primerNombre = arrayNombres[0];
        resultado.segundoNombre = arrayNombres.slice(1).join(' '); 
    }

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
      
      {/* Vista Previa o Video en Vivo */}
      {capturedImage ? (
          <img src={capturedImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Box className="scanner-overlay">
        {!capturedImage && <Box className="scanner-box-ocr"></Box>}
        
        <Typography variant="body2" sx={{ color: 'white', mt: 2, bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 1, borderRadius: 1, textAlign: 'center' }}>
            {status}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            {!capturedImage ? (
                <>
                    <Button variant="contained" color="error" onClick={onClose}>Cancelar</Button>
                    <Button variant="contained" color="info" onClick={capturePhoto} startIcon={<CameraAltIcon />}>
                        Capturar
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="contained" color="warning" onClick={retakePhoto} disabled={isProcessing} startIcon={<ReplayIcon />}>
                        Reintentar
                    </Button>
                    <Button variant="contained" color="success" onClick={analyzeWithGoogleVision} disabled={isProcessing} startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}>
                        {isProcessing ? 'Procesando...' : 'Analizar (API)'}
                    </Button>
                </>
            )}
        </Box>
      </Box>
    </Box>
  );
}