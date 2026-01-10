import React, { useEffect, useRef, useState } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { Box, Typography, IconButton, Select, MenuItem, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './CedulaScanner.css';

export default function CedulaScanner({ onScanSuccess, onClose }) {
    const videoRef = useRef(null);
    const controlsRef = useRef(null); // AQUÍ guardaremos el control para detener la cámara
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [reader] = useState(new BrowserPDF417Reader()); // Instancia única del lector

    // 1. OBTENER CÁMARAS AL INICIAR
    useEffect(() => {
        BrowserPDF417Reader.listVideoInputDevices()
            .then((videoInputDevices) => {
                setDevices(videoInputDevices);
                if (videoInputDevices.length > 0) {
                    // Buscar cámara trasera por nombre (back, trasera, environment, 0)
                    const backCam = videoInputDevices.find(d => 
                        d.label.toLowerCase().includes('back') || 
                        d.label.toLowerCase().includes('trasera') || 
                        d.label.toLowerCase().includes('0')
                    );
                    // Si encuentra trasera usa esa, si no la última de la lista
                    const defaultId = backCam ? backCam.deviceId : videoInputDevices[videoInputDevices.length - 1].deviceId;
                    setSelectedDeviceId(defaultId);
                } else {
                    setLoading(false);
                    alert("No se detectaron cámaras.");
                }
            })
            .catch((err) => {
                console.error("Error listando cámaras:", err);
                setLoading(false);
            });

        // LIMPIEZA AL SALIR (Desmontar componente)
        return () => {
            if (controlsRef.current) {
                controlsRef.current.stop(); // Detener cámara correctamente
                controlsRef.current = null;
            }
        };
    }, []);

    // 2. INICIAR/CAMBIAR CÁMARA
    useEffect(() => {
        if (!selectedDeviceId) return;

        const startScan = async () => {
            setLoading(true);
            
            // Si ya hay una cámara corriendo, detenerla primero
            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }

            try {
                // Iniciar escaneo en el elemento <video>
                const controls = await reader.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            const text = result.getText();
                            // Filtro para evitar lecturas falsas cortas
                            if (text.length > 15) {
                                // DETENER CAMARA ANTES DE SALIR
                                controls.stop();
                                controlsRef.current = null;
                                onScanSuccess(text);
                            }
                        }
                    }
                );
                
                controlsRef.current = controls; // Guardamos el control para poder detenerlo luego
                setLoading(false);
                
                // Intentar aplicar Zoom 2x nativo
                aplicarZoom(videoRef.current);

            } catch (error) {
                console.error("Error iniciando escáner:", error);
                setLoading(false);
            }
        };

        startScan();

    }, [selectedDeviceId, reader, onScanSuccess]);

    // Función auxiliar para forzar Zoom (Truco para S21/S23)
    const aplicarZoom = (videoElement) => {
        try {
            if (videoElement && videoElement.srcObject) {
                const track = videoElement.srcObject.getVideoTracks()[0];
                const capabilities = track.getCapabilities();
                if (capabilities.zoom) {
                    // Aplicar un zoom de 2.0x si el hardware lo permite
                    track.applyConstraints({ advanced: [{ zoom: 2.0 }] });
                }
            }
        } catch (e) {
            console.log("Zoom no soportado en este navegador/lente", e);
        }
    };

    return (
        <Box sx={{ 
            position: 'relative', width: '100%', height: '500px', 
            bgcolor: 'black', borderRadius: '16px', overflow: 'hidden', 
            display: 'flex', flexDirection: 'column' 
        }}>
            
            {/* VIDEO NATIVO */}
            <video 
                ref={videoRef} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted
            />

            {/* INTERFAZ VISUAL */}
            {!loading && (
                <>
                    {/* Marco Rojo Láser */}
                    <div className="scanner-overlay">
                        <div className="scanner-box">
                            <div className="scanner-line"></div>
                        </div>
                        <Typography variant="caption" className="scanner-text" sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 0.5, borderRadius: 2 }}>
                            Enfoca el cuadro denso
                        </Typography>
                    </div>

                    {/* Botón Cerrar */}
                    <IconButton 
                        onClick={() => {
                            if(controlsRef.current) controlsRef.current.stop();
                            onClose();
                        }}
                        sx={{ position: 'absolute', top: 15, right: 15, color: 'white', bgcolor: 'rgba(255,50,50,0.8)', zIndex: 20 }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {/* Selector de Cámara Manual */}
                    <Box sx={{ 
                        position: 'absolute', bottom: 0, left: 0, width: '100%', 
                        p: 2, zIndex: 20, 
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                        display: 'flex', flexDirection: 'column', gap: 1
                    }}>
                        <Typography variant="caption" sx={{ color: '#aaa', ml: 1 }}>Cámara:</Typography>
                        
                        <Select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            variant="standard"
                            disableUnderline
                            sx={{ 
                                color: 'white', 
                                '.MuiSelect-icon': { color: 'white' },
                                bgcolor: 'rgba(255,255,255,0.15)',
                                px: 2, py: 0.5, borderRadius: 2,
                                fontSize: '0.9rem'
                            }}
                        >
                            {devices.map((device, index) => (
                                <MenuItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Cámara ${index + 1}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                </>
            )}

            {loading && (
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <CircularProgress color="success" />
                    <Typography color="white" mt={2}>Iniciando cámara...</Typography>
                </Box>
            )}
        </Box>
    );
}