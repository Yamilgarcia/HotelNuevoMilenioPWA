import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  InputAdornment,
  Typography,
  Autocomplete,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import CedulaScanner from "../../../components/CedulaScanner";
import { supabase } from "../../../supabase.config";
import "./CheckInModal.css";

export default function CheckInModal({ open, onClose, habitacion, onConfirm }) {
  const [clientesPrevios, setClientesPrevios] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [errorDocumento, setErrorDocumento] = useState(false);
  const [errorTelefono, setErrorTelefono] = useState(false);
  const [buscadorValue, setBuscadorValue] = useState(null);

  const formatDateTimeLocal = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date - offset).toISOString().slice(0, 16);
  };

  const hoy = new Date();
  
  // Calculamos el día de mañana y fijamos la hora de salida a las 11:00 AM
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  manana.setHours(11, 0, 0, 0);

  const initialState = {
    tipoDocumento: "Cédula",
    documento: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    lugarNacimiento: "", // <-- NUEVO CAMPO
    fechaNacimiento: "", // <-- NUEVO CAMPO
    personas: 1, // Por defecto inicia en 1
    fechaEntrada: formatDateTimeLocal(hoy),
    fechaSalida: formatDateTimeLocal(manana),
    descuentoPorcentaje: 0,
    adelanto: 0,
    observaciones: "",
    aceptaPrivacidad: false,
  };

  const [form, setForm] = useState(initialState);

  // 1. REGLA DE CAPACIDAD: Determinamos máximo de personas
  const maxPersonas = useMemo(() => {
    if (!habitacion) return 1;
    const categoria = habitacion.categoria?.toLowerCase() || "";
    // Las dobles permiten hasta 3, las demás (sencillas y privadas) máximo 2
    if (categoria.includes("doble")) return 3;
    return 2; 
  }, [habitacion]);

  // Si se cambia de habitación y supera el límite nuevo, lo ajustamos
  useEffect(() => {
    if (form.personas > maxPersonas) {
      setForm((prev) => ({ ...prev, personas: maxPersonas }));
    }
  }, [maxPersonas, form.personas]);

  useEffect(() => {
    if (open) {
      const fetchClientes = async () => {
        const { data } = await supabase.from("clientes").select("*");
        if (data) setClientesPrevios(data);
      };
      fetchClientes();
    }
  }, [open]);

  const diasEstadia = useMemo(() => {
    const f1 = new Date(form.fechaEntrada);
    const f2 = new Date(form.fechaSalida);

    // TRUCO: Forzamos ambas fechas a la medianoche (00:00:00)
    // Así el sistema ignora si entró a las 10am y salió a las 11am, solo cuenta los días
    f1.setHours(0, 0, 0, 0);
    f2.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(f2 - f1);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 1;
  }, [form.fechaEntrada, form.fechaSalida]);

  // 2. REGLA DE PRECIOS: 500 (1-2 pers) o 600 (3 pers) en las Dobles
  const tarifaBaseCalculada = useMemo(() => {
    if (!habitacion) return 0;
    let precioBase = Number(habitacion.precio) || 0;
    const categoria = habitacion.categoria?.toLowerCase() || "";
    
    if (categoria.includes("doble")) {
      precioBase = form.personas === 3 ? 600 : 500;
    }
    
    return precioBase;
  }, [habitacion, form.personas]);

  const calculosFinales = useMemo(() => {
    const subtotal = tarifaBaseCalculada * diasEstadia;
    const montoDescuento = (subtotal * (Number(form.descuentoPorcentaje) || 0)) / 100;
    const totalAPagar = subtotal - montoDescuento;
    const saldoRestante = totalAPagar - (Number(form.adelanto) || 0);
    return { subtotal, montoDescuento, totalAPagar, saldoRestante };
  }, [
    tarifaBaseCalculada,
    diasEstadia,
    form.descuentoPorcentaje,
    form.adelanto,
  ]);

  const validarDocumento = (tipo, doc) => {
    if (!doc) return false;
    if (tipo === "Cédula") return /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(doc);
    return doc.trim().length > 4;
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      value = checked;
    }

    if (name === "tipoDocumento") {
      setForm((prev) => ({ ...prev, tipoDocumento: value, documento: "" }));
      setErrorDocumento(false);
      return;
    }

    // Validación de letras extendida para incluir comas y puntos en el Lugar de Nacimiento
    if (["primerNombre", "segundoNombre", "primerApellido", "segundoApellido", "lugarNacimiento"].includes(name)) {
      const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s,.-]*$/;
      if (!regexSoloLetras.test(value)) return;
    }

    if (name === "telefono") {
      let soloNumeros = value.replace(/\D/g, "");
      if (soloNumeros.length > 8) soloNumeros = soloNumeros.substring(0, 8);

      if (soloNumeros.length > 4) {
        value = `${soloNumeros.substring(0, 4)}-${soloNumeros.substring(4)}`;
      } else {
        value = soloNumeros;
      }

      if (value.length > 0 && value.length < 9) {
        setErrorTelefono("Incompleto (Faltan dígitos)");
      } else if (value.length === 9 && !/^[2578]/.test(value)) {
        setErrorTelefono("Debe iniciar con 2, 5, 7 u 8");
      } else {
        setErrorTelefono(false);
      }
    }

    if (name === "documento") {
      value = value.toUpperCase();
      if (form.tipoDocumento === "Cédula") {
        if (value.length === 3 && form.documento.length === 2) value += "-";
        if (value.length === 10 && form.documento.length === 9) value += "-";
        if (value.length >= 16) setErrorDocumento(!validarDocumento("Cédula", value));
        else setErrorDocumento(false);
      } else {
        setErrorDocumento(!validarDocumento(form.tipoDocumento, value));
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (event, newValue) => {
    setBuscadorValue(newValue);
    if (newValue) {
      setForm((prev) => ({
        ...prev,
        tipoDocumento: "Cédula",
        documento: newValue.cedula || "",
        primerNombre: newValue.primer_nombre || "",
        segundoNombre: newValue.segundo_nombre || "",
        primerApellido: newValue.primer_apellido || "",
        segundoApellido: newValue.segundo_apellido || "",
        telefono: newValue.telefono || "",
        lugarNacimiento: newValue.lugar_nacimiento || "", // <-- NUEVO
        fechaNacimiento: newValue.fecha_nacimiento || "", // <-- NUEVO
      }));
      setErrorDocumento(false);
      setErrorTelefono(false);
    }
  };

  const handleNuevoCliente = () => {
    setBuscadorValue(null);
    setForm((prev) => ({
      ...prev,
      tipoDocumento: "Cédula",
      documento: "",
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      telefono: "",
      lugarNacimiento: "", // <-- NUEVO
      fechaNacimiento: "", // <-- NUEVO
    }));
    setErrorDocumento(false);
    setErrorTelefono(false);
  };

  const handleScanData = (datosExtraidos) => {
    setForm((prev) => ({
      ...prev,
      tipoDocumento: "Cédula",
      documento: datosExtraidos.cedula || prev.documento,
      primerNombre: datosExtraidos.primerNombre || prev.primerNombre,
      segundoNombre: datosExtraidos.segundoNombre || prev.segundoNombre,
      primerApellido: datosExtraidos.primerApellido || prev.primerApellido,
      segundoApellido: datosExtraidos.segundoApellido || prev.segundoApellido,
      fechaNacimiento: datosExtraidos.fechaNacimiento || prev.fechaNacimiento,
    }));
    setErrorDocumento(
      datosExtraidos.cedula ? !validarDocumento("Cédula", datosExtraidos.cedula) : false
    );
    setShowScanner(false);
  };

  const handleSubmit = () => {
    if (!form.primerNombre.trim() || !form.primerApellido.trim())
      return alert("Nombres y apellidos obligatorios.");
    if (form.documento && !validarDocumento(form.tipoDocumento, form.documento))
      return alert("Documento inválido.");
    if (errorTelefono)
      return alert("Por favor, corrija el número de teléfono.");

    const formPreparado = { ...form, cedula: form.documento };
    onConfirm(habitacion.id, formPreparado, calculosFinales.totalAPagar);
    handleClose();
  };

  const handleClose = () => {
    setForm(initialState);
    setBuscadorValue(null);
    setErrorDocumento(false);
    setErrorTelefono(false);
    setShowScanner(false);
    onClose();
  };

  if (!habitacion) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth PaperProps={{ className: "modal-fondo", sx: { margin: { xs: 1, md: 4 } } }}>
      <DialogTitle sx={{ bgcolor: "#1e2b3c", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", py: 2, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BedIcon fontSize="large" />
          <Typography variant="h6" fontWeight="bold">Procesar Habitación</Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "white" }}><CloseIcon fontSize="medium" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3, md: 4 } }}>
        <Box className="panel-seccion" sx={{ mb: { xs: 2, md: 4 }, display: "block" }}>
          <Typography className="titulo-seccion">Datos de la habitación</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 2 }}>
            <Box>
              <Typography className="info-label">Nombre/Nro</Typography>
              <Typography className="info-value">{habitacion.numero}</Typography>
            </Box>
            <Box>
              <Typography className="info-label">Tarifa</Typography>
              <Typography className="info-value">24 Horas</Typography>
            </Box>
            <Box>
              <Typography className="info-label">Tipo</Typography>
              <Typography className="info-value" sx={{ textTransform: "uppercase" }}>{habitacion.categoria}</Typography>
            </Box>
            <Box sx={{ gridColumn: { xs: "span 2", md: "span 2" } }}>
              <Typography className="info-label">Detalles / Amenidades</Typography>
              <Typography className="info-value" sx={{ textTransform: "uppercase", fontSize: { xs: "0.85rem", sm: "1.05rem" } }}>
                {habitacion.amenidades || "SIN ESPECIFICAR"}
              </Typography>
            </Box>
            <Box>
              <Typography className="info-label">Precio Base</Typography>
              <Typography className="info-value" fontWeight="bold">C$ {tarifaBaseCalculada}</Typography>
            </Box>
          </Box>
        </Box>

        {showScanner ? (
          <Box className="panel-seccion">
            <CedulaScanner onScanSuccess={handleScanData} onClose={() => setShowScanner(false)} />
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: { xs: 2, md: 4 }, alignItems: "stretch" }}>
            
            {/* DATOS DEL CLIENTE */}
            <Box className="panel-seccion">
              <Typography className="titulo-seccion">DATOS DEL CLIENTE</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
                <Autocomplete
                  sx={{ flexGrow: 1, minWidth: "200px" }}
                  freeSolo
                  options={clientesPrevios}
                  value={buscadorValue}
                  getOptionLabel={(option) => (option ? `${option.cedula} - ${option.nombre_completo}` : "")}
                  onChange={handleClientSelect}
                  renderInput={(params) => <TextField {...params} label="Buscar cliente existente..." InputLabelProps={{ shrink: true }} />}
                />
                <Tooltip title="Escanear Cédula">
                  <Button variant="contained" sx={{ bgcolor: "#2c3e50" }} onClick={() => setShowScanner(true)}>
                    <QrCodeScannerIcon />
                  </Button>
                </Tooltip>
                <Tooltip title="Nuevo Cliente">
                  <Button variant="contained" color="primary" onClick={handleNuevoCliente}>
                    <PersonAddAlt1Icon />
                  </Button>
                </Tooltip>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                <TextField select label="Tipo doc." name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }}>
                  <MenuItem value="Cédula">Cédula Nic.</MenuItem>
                  <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                  <MenuItem value="DNI">Cédula Extranjera</MenuItem>
                </TextField>
                <TextField label="Número Documento" name="documento" value={form.documento} onChange={handleChange} error={errorDocumento} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Primer Nombre *" name="primerNombre" value={form.primerNombre} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Segundo Nombre" name="segundoNombre" value={form.segundoNombre} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Primer Apellido *" name="primerApellido" value={form.primerApellido} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Segundo Apellido" name="segundoApellido" value={form.segundoApellido} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />

                {/* --- NUEVOS CAMPOS --- */}
                <TextField label="Lugar de Nacimiento" name="lugarNacimiento" value={form.lugarNacimiento} onChange={handleChange} placeholder="Ej. Managua" fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Fecha de Nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />

                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                  <TextField label="Teléfono / Celular (Opcional)" name="telefono" value={form.telefono} onChange={handleChange} error={!!errorTelefono} helperText={errorTelefono} placeholder="Ej: 0000-0000" fullWidth InputLabelProps={{ shrink: true }} />
                </Box>

                {/* DECLARACIÓN LEGAL */}
                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" }, mt: 2, p: 2, bgcolor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold", color: "#2c3e50", display: "block", mb: 1 }}>
                    DECLARACIÓN DE PRIVACIDAD Y CONSENTIMIENTO INFORMADO
                  </Typography>
                  <Box sx={{ height: "180px", overflowY: "auto", bgcolor: "#ffffff", border: "1px solid #ced4da", borderRadius: 1, p: 1.5, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "#333", display: "block", textAlign: "justify", mb: 1, lineHeight: 1.4 }}>
                      En cumplimiento con la Ley N.º 787, Ley de Protección de Datos Personales de la República de Nicaragua, y en concordancia con las mejores prácticas internacionales de privacidad (GDPR), el Hotel Nuevo Milenio le informa lo siguiente:
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#333", display: "block", textAlign: "justify", mb: 1, lineHeight: 1.4 }}>
                      <strong>Finalidad de la Recolección:</strong> Los datos personales extraídos de su documento de identidad (Cédula) mediante escaneo óptico (OCR) o proporcionados verbalmente, serán utilizados exclusivamente para gestionar su reserva, realizar el registro de entrada (check-in) y salida (check-out), emitir la facturación correspondiente y mantener el control de seguridad interno del establecimiento.
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#333", display: "block", textAlign: "justify", mb: 1, lineHeight: 1.4 }}>
                      <strong>Procesamiento y Almacenamiento:</strong> Sus datos serán almacenados de forma segura en nuestra base de datos cifrada y no serán compartidos, vendidos, ni transferidos a terceros ajenos a la administración del hotel, salvo requerimiento expreso de autoridades competentes según lo dicta la ley.
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#333", display: "block", textAlign: "justify", mb: 1, lineHeight: 1.4 }}>
                      <strong>Análisis de Datos:</strong> El hotel podrá utilizar información transaccional anonimizada (fechas de estadía, procedencia) con fines estadísticos internos para mejorar la calidad del servicio. No se utilizarán sus datos de contacto para campañas de mercadeo sin su autorización expresa adicional.
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#333", display: "block", textAlign: "justify", mb: 1.5, lineHeight: 1.4 }}>
                      <strong>Derechos del Titular:</strong> Usted tiene derecho a solicitar el acceso, rectificación, o cancelación de sus datos personales de nuestros registros en cualquier momento, dirigiéndose a la administración del hotel.
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#000", display: "block", textAlign: "justify", lineHeight: 1.4, fontStyle: "italic", borderTop: "1px dashed #ccc", pt: 1 }}>
                      Al facilitar su documento de identidad para el registro, usted declara haber sido informado y otorga su consentimiento para el tratamiento de sus datos bajo las condiciones antes descritas.
                    </Typography>
                  </Box>
                  <FormControlLabel control={<Checkbox name="aceptaPrivacidad" checked={form.aceptaPrivacidad} onChange={handleChange} color="success" />} label={<Typography variant="body2" sx={{ fontWeight: "bold", color: form.aceptaPrivacidad ? "#28a745" : "#dc3545" }}>El cliente acepta los términos de privacidad *</Typography>} />
                </Box>
              </Box>
            </Box>

            {/* DATOS DEL ALOJAMIENTO */}
            <Box className="panel-seccion">
              <Typography className="titulo-seccion">DATOS DEL ALOJAMIENTO</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                <TextField label="Fecha y hora de entrada" name="fechaEntrada" type="datetime-local" value={form.fechaEntrada} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Fecha y hora de salida" name="fechaSalida" type="datetime-local" value={form.fechaSalida} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                
                {/* DIBUJAMOS LAS OPCIONES BASADAS EN EL LÍMITE */}
                <TextField select label="Cant. Personas" name="personas" value={form.personas} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }}>
                  {Array.from({ length: maxPersonas }, (_, i) => i + 1).map((n) => (
                    <MenuItem key={n} value={n}>{n} Persona(s)</MenuItem>
                  ))}
                </TextField>

                <TextField label="Días de Hospedaje" value={diasEstadia} InputProps={{ readOnly: true }} fullWidth sx={{ bgcolor: "#f8f9fa" }} InputLabelProps={{ shrink: true }} />
                <TextField label="Descuento" name="descuentoPorcentaje" type="number" value={form.descuentoPorcentaje} onChange={handleChange} fullWidth InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} InputLabelProps={{ shrink: true }} />
                <TextField label="Subtotal (Sin Desc.)" value={`C$ ${calculosFinales.subtotal}`} InputProps={{ readOnly: true }} fullWidth sx={{ bgcolor: "#f8f9fa" }} InputLabelProps={{ shrink: true }} />
                <TextField label="Adelanto / Depósito" name="adelanto" type="number" value={form.adelanto} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">C$</InputAdornment> }} InputLabelProps={{ shrink: true }} />
                <TextField label="Total a Pagar" value={`C$ ${calculosFinales.totalAPagar}`} InputProps={{ readOnly: true }} fullWidth sx={{ bgcolor: "#e8f5e9" }} InputLabelProps={{ shrink: true }} />
                
                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                  <TextField label="Observaciones del Registro" name="observaciones" value={form.observaciones} onChange={handleChange} fullWidth placeholder="Detalles de facturación, placas..." InputLabelProps={{ shrink: true }} />
                </Box>
              </Box>

              <Box className="caja-saldo">
                <Typography variant="body2" fontWeight="bold" color="textSecondary">SALDO PENDIENTE:</Typography>
                <Typography variant="h5" fontWeight="900" color={calculosFinales.saldoRestante > 0 ? "#d32f2f" : "#2e7d32"}>C$ {calculosFinales.saldoRestante}</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {!showScanner && (
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#e9ecef", borderTop: "1px solid #ced4da", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
          <Button onClick={handleClose} variant="contained" fullWidth sx={{ py: 1.5, bgcolor: "#6c757d", color: "white", fontWeight: "bold", "&:hover": { bgcolor: "#5a6268" } }}>CANCELAR</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!form.aceptaPrivacidad} sx={{ px: 5, py: 1.5, bgcolor: "#28a745", opacity: form.aceptaPrivacidad ? 1 : 0.5, "&:hover": { bgcolor: "#218838" } }}>GUARDAR REGISTRO</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}