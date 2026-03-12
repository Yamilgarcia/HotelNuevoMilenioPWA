import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, MenuItem, InputAdornment, Grid, Typography, Divider
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CedulaScanner from '../../../components/CedulaScanner'; // Ajusta la ruta según tu proyecto

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

  // Lógica de Precios
  const precioCalculado = useMemo(() => {
    if (!habitacion) return 0;
    let precioBase = Number(habitacion.precio) || 0;
    const categoria = habitacion.categoria?.toLowerCase() || '';
    if (categoria.includes('doble')) return form.personas >= 3 ? 600 : 500;
    return precioBase;
  }, [habitacion, form.personas]);

  // --- NUEVA LÓGICA OCR ---
  const handleScanData = (datosExtraidos) => {
    setForm(prev => ({
        ...prev,
        cedula: datosExtraidos.cedula || prev.cedula,
        primerNombre: datosExtraidos.primerNombre || prev.primerNombre,
        segundoNombre: datosExtraidos.segundoNombre || prev.segundoNombre,
        primerApellido: datosExtraidos.primerApellido || prev.primerApellido,
        segundoApellido: datosExtraidos.segundoApellido || prev.segundoApellido
    }));

    // Validar cédula extraída
    if (datosExtraidos.cedula && !validarCedulaNica(datosExtraidos.cedula)) {
        setErrorCedula(true);
    } else {
        setErrorCedula(false);
    }

    setShowScanner(false);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Vibración de éxito doble
  };

  const validarCedulaNica = (cedula) => /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cedula') {
      value = value.toUpperCase();
      if (value.length === 3 && form.cedula.length === 2) value += '-';
      if (value.length === 10 && form.cedula.length === 9) value += '-';
      if (value.length >= 16) setErrorCedula(!validarCedulaNica(value));
      else setErrorCedula(false);
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.primerNombre.trim() || !form.primerApellido.trim()) return alert('Nombres obligatorios');
    if (form.cedula && !validarCedulaNica(form.cedula)) {
        alert('Cédula inválida. Formato: 000-000000-0000X');
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
        {showScanner ? (
            <CedulaScanner onScanSuccess={handleScanData} onClose={() => setShowScanner(false)} />
        ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: -1, fontWeight: 'bold' }}>IDENTIFICACIÓN</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        label="Cédula" name="cedula" value={form.cedula} onChange={handleChange} fullWidth
                        error={errorCedula} inputProps={{ maxLength: 16 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><CreditCardIcon /></InputAdornment> }}
                    />
                    <Button variant="contained" sx={{ bgcolor: '#334155', minWidth: '100px' }} onClick={() => setShowScanner(true)}>
                        <QrCodeScannerIcon />
                    </Button>
                </Box>

                <Typography variant="subtitle2" sx={{ color: '#64748b', mt: 1, mb: -1, fontWeight: 'bold' }}>DATOS DEL HUÉSPED</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Primer Nombre" name="primerNombre" value={form.primerNombre} onChange={handleChange} fullWidth required /></Grid>
                    <Grid item xs={6}><TextField label="Segundo Nombre" name="segundoNombre" value={form.segundoNombre} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={6}><TextField label="Primer Apellido" name="primerApellido" value={form.primerApellido} onChange={handleChange} fullWidth required /></Grid>
                    <Grid item xs={6}><TextField label="Segundo Apellido" name="segundoApellido" value={form.segundoApellido} onChange={handleChange} fullWidth /></Grid>
                </Grid>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: -1, fontWeight: 'bold' }}>COBRO</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                        <TextField select label="Personas" name="personas" value={form.personas} onChange={handleChange} fullWidth>
                            {[1, 2, 3, 4, 5].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ bgcolor: '#ecfdf5', p: 1.5, borderRadius: 2, border: '1px solid #10b981', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#047857', fontWeight: 'bold' }}>TOTAL</Typography>
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
            <Button onClick={handleSubmit} variant="contained" color="success" startIcon={<AttachMoneyIcon />} sx={{ fontWeight: 'bold' }}>COBRAR</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}