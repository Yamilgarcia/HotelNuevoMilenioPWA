import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Box, Typography, Button } from '@mui/material';

export default function CedulaScanner({ onScanSuccess, onClose }) {
  const [mensaje, setMensaje] = useState("Iniciando modo depuración...");

  useEffect(() => {
    console.log("🔵 [DEBUG] 1. Montando componente CedulaScanner...");

    // Definimos la configuración para poder loguearla
    const config = { 
        fps: 10, 
        qrbox: { width: 300, height: 250 }, 
        aspectRatio: 1.0,
        disableFlip: false, 
        // IMPORTANTE: Esto habilita el chip nativo de Android
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        },
        videoConstraints: {
            facingMode: "environment", 
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 },
            focusMode: "continuous"
        }
    };

    console.log("🔵 [DEBUG] 2. Configuración cargada:", config);

    // Creamos la instancia
    const scanner = new Html5QrcodeScanner("reader", config, /* verbose= */ true); // Verbose true ayuda también

    // --- CALLBACK DE ÉXITO ---
    const onDetect = (decodedText, decodedResult) => {
      console.log("🟢 [DEBUG] ¡LECTURA EXITOSA DETECTADA!");
      console.log("📄 Texto crudo:", decodedText);
      console.log("📊 Objeto completo:", decodedResult);

      if (decodedText.length < 15) {
        console.warn("🟠 [DEBUG] Lectura ignorada: Es muy corta (" + decodedText.length + " caracteres).");
        setMensaje("⚠️ Leí algo, pero es muy corto. ¿Es el código de barras pequeño?");
      } else {
        console.log("✅ [DEBUG] Código válido. Enviando a la app...");
        scanner.clear().then(() => {
            console.log("🔵 [DEBUG] Escáner limpiado post-éxito.");
            onScanSuccess(decodedText);
        }).catch(err => console.error("🔴 Error limpiando:", err));
      }
    };

    // --- CALLBACK DE ERROR ---
    // Esto se ejecuta CADA VEZ que el escáner mira un frame y no ve nada.
    // O cuando subes una foto y falla al leerla.
    const onError = (errorMessage) => {
      // Filtramos mensajes repetitivos para no saturar, pero mostramos los importantes
      if (typeof errorMessage === 'string') {
          if(errorMessage.includes("No MultiFormat Readers")) {
              // Este es el error normal de "no veo nada en este frame"
              // Lo ignoramos para no ensuciar, o lo ponemos en debug
              // console.debug("."); 
              return;
          }
      }
      console.error("🔴 [DEBUG] FALLO DE LECTURA:", errorMessage);
    };

    console.log("🔵 [DEBUG] 3. Renderizando escáner en el DOM...");
    scanner.render(onDetect, onError);

    // Limpieza al salir
    return () => {
      console.log("🔵 [DEBUG] 4. Desmontando componente. Limpiando escáner...");
      scanner.clear().catch(err => console.error("🔴 [DEBUG] Error al limpiar:", err));
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#000', color: 'white', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Escáner (Modo DEBUG)
      </Typography>
      
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#fbbf24', fontWeight: 'bold' }}>
        {mensaje}
      </Typography>
      
      {/* Caja negra donde se monta el video/input */}
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', border: '2px solid red' }}></div>
      
      <Box sx={{ mt: 2, border: '1px dashed #666', p: 1 }}>
         <Typography variant="caption" color="#aaa">
            Abre la consola del navegador para ver los logs.
         </Typography>
      </Box>

      <Button onClick={onClose} variant="outlined" color="error" sx={{ mt: 2 }}>
        Cancelar
      </Button>
    </Box>
  );
}