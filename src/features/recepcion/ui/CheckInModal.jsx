// src/features/recepcion/ui/CheckInModal.jsx
import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, MenuItem, InputAdornment, Grid, Typography, Divider, IconButton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

// Importamos el componente del escáner
import CedulaScanner from '../../../components/CedulaScanner'; 

export default function CheckInModal({ open, onClose, habitacion, onConfirm }) {
  const [form, setForm] = useState({
    cedula: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    personas: 1,
  });

  const [errorCedula, setErrorCedula] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // --- LÓGICA DE PRECIOS AUTOMÁTICA ---
  const precioCalculado = useMemo(() => {
    if (!habitacion) return 0;
    let precioBase = Number(habitacion.precio) || 0;
    const categoria = habitacion.categoria?.toLowerCase() || '';

    // Regla: Habitaciones Dobles (3+ personas = 600, sino 500)
    if (categoria.includes('doble')) {
      return form.personas >= 3 ? 600 : 500;
    }
    return precioBase;
  }, [habitacion, form.personas]);

  // --- PROCESAMIENTO DEL ESCÁNER (DEBUG ACTIVO) ---
  const handleScanData = (rawData) => {
    // ⚠️ IMPORTANTE: Esta alerta nos dirá qué está leyendo exactamente tu celular.
    // Mándame una foto de lo que salga aquí.
    alert("DATOS DEL CÓDIGO:\n" + rawData);

    // Intentamos buscar la cédula aunque tenga caracteres raros alrededor
    // Busca: 3 dígitos, opcional guion, 6 dígitos, opcional guion, 4 dígitos, letra mayúscula
    const regexCedula = /(\d{3})-?(\d{6})-?(\d{4}[A-Z])/;
    const match = rawData.match(regexCedula);

    let nuevaCedula = "";
    if (match) {
        // Reconstruimos el formato con guiones: 121-251090-0000A
        nuevaCedula = `${match[1]}-${match[2]}-${match[3]}`;
        
        setForm(prev => ({
            ...prev,
            cedula: nuevaCedula
        }));
        
        alert("✅ Cédula detectada: " + nuevaCedula);
        setShowScanner(false); // Cerramos cámara solo si tuvo éxito
    } else {
        // Si falla, no cerramos la cámara para que intente de nuevo
        console.log("Lectura fallida o formato desconocido:", rawData);
    }
  };

  // --- VALIDACIÓN MANUAL DE CÉDULA ---
  const validarCedulaNica = (cedula) => {
    const regex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
    return regex.test(cedula);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cedula') {
      value = value.toUpperCase();
      // Auto-formato al escribir manual
      if (value.length === 3 && form.cedula.length === 2) value += '-';
      if (value.length === 10 && form.cedula.length === 9) value += '-';

      if (value.length >= 16) {
        setErrorCedula(!validarCedulaNica(value));
      } else {
        setErrorCedula(false);
      }
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.primerNombre.trim() || !form.primerApellido.trim()) {
        alert('⚠️ Primer Nombre y Primer Apellido son obligatorios.');
        return;
    }
    if (form.cedula && !validarCedulaNica(form.cedula)) {
        alert('⚠️ Cédula inválida. Formato: 000-000000-0000X');
        setErrorCedula(true);
        return;
    }

    onConfirm(habitacion.id, form, precioCalculado);
    handleClose();
  };

  const handleClose = () => {
    setForm({ cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', personas: 1 });
    setErrorCedula(false);
    setShowScanner(false);
    onClose();
  };

  if (!habitacion) return null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white', display: 'flex', gap: 1, alignItems: 'center' }}>
        <PersonAddIcon /> Check-in: Habitación {habitacion.numero}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        
        {/* --- MODO ESCÁNER --- */}
        {showScanner ? (
            <CedulaScanner 
                onScanSuccess={handleScanData} 
                onClose={() => setShowScanner(false)} 
            />
        ) : (
            /* --- MODO FORMULARIO --- */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* SECCIÓN IDENTIFICACIÓN */}
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: -1, fontWeight: 'bold' }}>
                IDENTIFICACIÓN
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TextField
                    label="Cédula de Identidad"
                    name="cedula"
                    value={form.cedula}
                    onChange={handleChange}
                    fullWidth
                    placeholder="121-251090-1000A"
                    error={errorCedula}
                    helperText={errorCedula ? 'Formato inválido' : ''}
                    inputProps={{ maxLength: 16 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><CreditCardIcon /></InputAdornment>,
                    }}
                />
                <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#334155', minWidth: '100px', height: '56px', display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}
                    onClick={() => setShowScanner(true)}
                >
                    <QrCodeScannerIcon />
                    <Typography variant="caption">Escanear</Typography>
                </Button>
            </Box>

            {/* SECCIÓN DATOS PERSONALES */}
            <Typography variant="subtitle2" sx={{ color: '#64748b', mt: 1, mb: -1, fontWeight: 'bold' }}>
                DATOS DEL HUÉSPED
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                <TextField label="Primer Nombre" name="primerNombre" value={form.primerNombre} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={6}>
                <TextField label="Segundo Nombre" name="segundoNombre" value={form.segundoNombre} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6}>
                <TextField label="Primer Apellido" name="primerApellido" value={form.primerApellido} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={6}>
                <TextField label="Segundo Apellido" name="segundoApellido" value={form.segundoApellido} onChange={handleChange} fullWidth />
                </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* SECCIÓN COBRO */}
            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: -1, fontWeight: 'bold' }}>
                COBRO (PAGO ADELANTADO)
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                <TextField select label="Personas" name="personas" value={form.personas} onChange={handleChange} fullWidth>
                    {[1, 2, 3, 4, 5].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
                </Grid>
                <Grid item xs={6}>
                <Box sx={{ bgcolor: '#ecfdf5', p: 1.5, borderRadius: 2, border: '1px solid #10b981', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 'bold' }}>A COBRAR AHORA</Typography>
                    <Typography variant="h5" sx={{ color: '#059669', fontWeight: 900 }}>C$ {precioCalculado}</Typography>
                </Box>
                </Grid>
            </Grid>
            </Box>
        )}
      </DialogContent>

      {!showScanner && (
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Button onClick={handleClose} color="inherit">Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" color="success" startIcon={<AttachMoneyIcon />} sx={{ fontWeight: 'bold' }}>
            COBRAR Y REGISTRAR
            </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}