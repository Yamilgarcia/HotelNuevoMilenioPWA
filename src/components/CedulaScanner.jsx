import React, { useEffect, useRef, useState } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './CedulaScanner.css'; // Asegúrate de que el CSS esté creado (abajo te lo repito por si acaso)

export default function CedulaScanner({ onScanSuccess, onClose }) {
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const reader = new BrowserPDF417Reader();
        let mounted = true;

        const iniciarScanner = async () => {
            try {
                // 1. Obtener todas las cámaras
                const devices = await BrowserPDF417Reader.listVideoInputDevices();
                
                // 2. Lógica automática para buscar la "Trasera Definitiva" (No la Angular)
                // Filtramos las que son traseras
                const backCameras = devices.filter(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('trasera') ||
                    d.label.toLowerCase().includes('environment') ||
                    d.label.toLowerCase().includes('0')
                );

                let selectedDeviceId;

                if (backCameras.length > 0) {
                    // TRUCO PARA SAMSUNG S21/S22/S23:
                    // A veces la cámara "0" o la primera es la Gran Angular (Wide).
                    // Intentamos buscar una que NO diga "wide" o "ultra".
                    const mainCamera = backCameras.find(d => 
                        !d.label.toLowerCase().includes('wide') && 
                        !d.label.toLowerCase().includes('ultra')
                    );
                    
                    // Si encontramos una "Normal", usamos esa. Si no, usamos la última de la lista (suele ser la buena en Android)
                    selectedDeviceId = mainCamera ? mainCamera.deviceId : backCameras[backCameras.length - 1].deviceId;
                } else if (devices.length > 0) {
                    // Si no hay etiquetas, usamos la última (fallback)
                    selectedDeviceId = devices[devices.length - 1].deviceId;
                }

                if (!mounted) return;

                // 3. Iniciar el escaneo con la cámara elegida
                const controls = await reader.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            const text = result.getText();
                            // Filtro de seguridad: solo aceptar si es largo (cédula)
                            if (text.length > 15) {
                                controls.stop(); // Detener cámara
                                controlsRef.current = null;
                                onScanSuccess(text);
                            }
                        }
                    }
                );
                
                controlsRef.current = controls;
                setLoading(false);

            } catch (error) {
                console.error("Error iniciando cámara:", error);
                setLoading(false);
            }
        };

        iniciarScanner();

        return () => {
            mounted = false;
            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }
        };
    }, [onScanSuccess]);

    return (
        <Box sx={{ 
            position: 'relative', width: '100%', height: '400px', // Altura fija cómoda
            bgcolor: 'black', borderRadius: '12px', overflow: 'hidden', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            
            {/* VIDEO (Sin selectores, ocupa todo el fondo) */}
            <video 
                ref={videoRef} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted
            />

            {/* INTERFAZ VISUAL LIMPIA */}
            {!loading && (
                <div className="scanner-overlay">
                    {/* Caja de enfoque */}
                    <div className="scanner-box">
                        <div className="scanner-line"></div>
                    </div>
                    
                    <Typography variant="caption" className="scanner-text" sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 0.5, borderRadius: 2, color: 'white' }}>
                        Enfoca el cuadro denso trasero
                    </Typography>

                    {/* Botón Cancelar abajo (Estilo simple como pediste) */}
                    <Button 
                        onClick={() => {
                            if(controlsRef.current) controlsRef.current.stop();
                            onClose();
                        }}
                        variant="contained" 
                        color="error" 
                        size="small"
                        sx={{ position: 'absolute', bottom: 20, zIndex: 30 }}
                    >
                        CANCELAR
                    </Button>
                </div>
            )}

            {loading && (
                <Box sx={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress color="success" />
                    <Typography color="white" mt={2} variant="caption">Cargando cámara...</Typography>
                </Box>
            )}
        </Box>
    );
}