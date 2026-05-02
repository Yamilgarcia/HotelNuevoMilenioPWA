import { useState, useEffect } from "react";
import { TextField, Button, MenuItem, Box, Typography, Divider, InputAdornment } from "@mui/material";
// Iconos para darle un toque premium
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useToast } from "../../../components/ToastContext";
import "./HabitacionForm.css";

const DETALLES_HABITACIONES = {
  "Sencilla 1": { precio: 300, amenidades: "Abanico, Cama" },
  "Sencilla 2": { precio: 350, amenidades: "Abanico, Cama, Televisor" },
  "Doble (2 personas)": { precio: 500, amenidades: "TV, Abanico, Cama" },
  "Doble (3 personas)": { precio: 600, amenidades: "TV, Abanico, Cama" },
  "Privada 1": { precio: 500, amenidades: "TV, Abanico, Baño interno" },
  "Privada 2": { precio: 700, amenidades: "TV, Abanico, Baño interno, AC" },
};

export default function HabitacionForm({ initialData, onSave, onClose }) {
  const { showToast } = useToast();
  
  const [form, setForm] = useState({
    numero: "",
    categoria: "Sencilla 1",
    precio: 300,
    amenidades: "Abanico, Cama"
  });

  const [errors, setErrors] = useState({});

  // Carga inicial de datos si estamos editando
  useEffect(() => {
    if (initialData) {
      setForm({
        numero: initialData.numero || "",
        categoria: initialData.categoria || "Sencilla 1",
        precio: initialData.precio || 300,
        amenidades: initialData.amenidades || ""
      });
    }
  }, [initialData]);

  // --- SOLUCIÓN: Interceptamos el cambio directo en el input ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si el usuario acaba de cambiar la "categoria" en el combo:
    if (name === "categoria") {
      const info = DETALLES_HABITACIONES[value];
      setForm((prev) => ({ 
        ...prev, 
        categoria: value,
        precio: info ? info.precio : prev.precio,
        amenidades: info ? info.amenidades : prev.amenidades
      }));
    } else {
      // Si cambia cualquier otra cosa (numero o precio final)
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.numero.toString().trim()) newErrors.numero = "Asigná un número de habitación";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave({ 
      ...form, 
      precio: Number(form.precio)
    }, initialData?.id);

    if (onClose) onClose();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="habitacion-form-container">
      <Box textAlign="center">
        <Typography variant="h5" className="form-title">
          {initialData ? (
            <><EditIcon sx={{ color: "#38bdf8", mr: 1, verticalAlign: 'middle' }} /> Editar Habitación</>
          ) : (
            <><AddCircleOutlineIcon sx={{ color: "#38bdf8", mr: 1, verticalAlign: 'middle' }} /> Nueva Habitación</>
          )}
        </Typography>
      </Box>

      <TextField
        label="Número de Habitación (Ej: 101)"
        name="numero"
        value={form.numero}
        onChange={handleChange}
        error={!!errors.numero}
        helperText={errors.numero}
        fullWidth
        className="input-field"
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MeetingRoomIcon sx={{ color: "rgba(255,255,255,0.4)" }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        select
        label="Tipo y Equipamiento"
        name="categoria"
        value={form.categoria}
        onChange={handleChange}
        fullWidth
        margin="normal"
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                bgcolor: '#1e293b',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }
            }
          }
        }}
      >
        {Object.keys(DETALLES_HABITACIONES).map((opcion) => (
          <MenuItem key={opcion} value={opcion}>
            {opcion}
          </MenuItem>
        ))}
      </TextField>

      <Box className="price-display">
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5 }}>
          Amenidades incluidas:
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500, color: "white" }}>
          {form.amenidades}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="h6">Precio Sugerido: C$ {form.precio}</Typography>
      </Box>

      <TextField
        label="Precio Final (Editable)"
        name="precio"
        type="number"
        value={form.precio}
        onChange={handleChange}
        fullWidth
        className="input-field"
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AttachMoneyIcon sx={{ color: "rgba(255,255,255,0.4)" }} />
            </InputAdornment>
          ),
        }}
      />

      <Button type="submit" variant="contained" className="submit-button" fullWidth>
        {initialData ? "Actualizar Datos" : "Guardar Habitación"}
      </Button>
    </Box>
  );
}