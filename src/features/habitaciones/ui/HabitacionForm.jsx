import { useState, useEffect } from "react";
import { TextField, Button, MenuItem, Box, Typography, Alert, Divider } from "@mui/material";
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
  
  const [form, setForm] = useState(initialData || {
    numero: "",
    categoria: "Sencilla 1",
    precio: 300,
    amenidades: "Abanico, Cama"
  });

  const [errors, setErrors] = useState({});

  // Cada vez que cambie la categoría, actualizamos precio y amenidades automáticamente
  useEffect(() => {
    if (!initialData) {
      const info = DETALLES_HABITACIONES[form.categoria];
      setForm(prev => ({ 
        ...prev, 
        precio: info.precio,
        amenidades: info.amenidades 
      }));
    }
  }, [form.categoria]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.numero.trim()) newErrors.numero = "Asigná un número de habitación";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Solo enviamos los datos que coinciden con las columnas de Supabase
    onSave({ 
      ...form, 
      precio: Number(form.precio)
    });

    showToast("✅ Habitación registrada", "success");
    if (onClose) onClose();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="habitacion-form-container">
      <Box textAlign="center">
        <Typography variant="h5" className="form-title">
          {initialData ? "Editar Habitación" : "Nueva Habitación"}
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
      />

      <TextField
        select
        label="Tipo y Equipamiento"
        name="categoria"
        value={form.categoria}
        onChange={handleChange}
        fullWidth
        margin="normal"
      >
        {Object.keys(DETALLES_HABITACIONES).map((opcion) => (
          <MenuItem key={opcion} value={opcion}>
            {opcion}
          </MenuItem>
        ))}
      </TextField>

      <Box className="price-display" sx={{ my: 2 }}>
        <Typography variant="body2">Amenidades:</Typography>
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{form.amenidades}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6">Precio: C$ {form.precio}</Typography>
      </Box>

      {/* Opción para editar precio manualmente si el admin quiere */}
      <TextField
        label="Precio Final (Editable)"
        name="precio"
        type="number"
        value={form.precio}
        onChange={handleChange}
        fullWidth
        className="input-field"
        margin="normal"
      />

      <Button type="submit" variant="contained" className="submit-button" fullWidth>
        {initialData ? "Actualizar" : "Guardar en Sistema"}
      </Button>
    </Box>
  );
}