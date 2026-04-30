import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase.config";
import { useAuth } from "../../features/auth/logic/AuthProvider";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  InputAdornment, 
  CircularProgress,
  Alert
} from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import HotelIcon from '@mui/icons-material/Hotel';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, loading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated && profile?.role) {
      const targetPath = profile.role === "administrador" ? "/dashboard" : "/habitaciones";
      navigate(targetPath, { replace: true });
    }
  }, [loading, isAuthenticated, profile, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      setErrorMsg("Credenciales inválidas. Intente nuevamente.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  if (!loading && isAuthenticated && profile?.role) {
    return <Navigate to={profile.role === "administrador" ? "/dashboard" : "/habitaciones"} replace />;
  }

  return (
    <>
      {/* Definición de Keyframes para las animaciones */}
      <style>
        {`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(30px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
            50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.5); }
            100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          // Fondo con "luces" radiales sutiles para dar profundidad
          background: `
            radial-gradient(circle at 15% 30%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(56, 189, 248, 0.05) 0%, transparent 40%),
            radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)
          `,
          padding: 2,
          overflow: "hidden" // Evita barras de scroll por los gradientes
        }}
      >
        <Paper
          elevation={0} // Quitamos la sombra base para usar la nuestra
          sx={{
            width: "100%",
            maxWidth: "420px",
            // Efecto Glassmorphism más pulido
            bgcolor: "rgba(30, 41, 59, 0.7)", 
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "28px",
            padding: { xs: "32px 24px", sm: "48px 40px" }, // Padding responsivo
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)", // Brillo superior
            boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.6)",
            textAlign: "center",
            // Animación de entrada principal
            animation: "fadeSlideUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          {/* Contenedor del Icono con animación flotante y resplandor */}
          <Box 
            sx={{ 
              width: 70, 
              height: 70, 
              bgcolor: "rgba(15, 23, 42, 0.6)", 
              borderRadius: "20px", 
              display: "flex", 
              justifyContent: "center",
              alignItems: "center", 
              margin: "0 auto 24px", 
              border: "1px solid rgba(56, 189, 248, 0.5)",
              animation: "pulseGlow 3s infinite, float 4s ease-in-out infinite",
              backdropFilter: "blur(4px)",
            }}
          >
            <HotelIcon sx={{ color: "#38bdf8", fontSize: 38 }} />
          </Box>

          <Typography variant="h4" fontWeight="800" sx={{ color: "white", mb: 1, letterSpacing: "-0.5px" }}>
            Bienvenido
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontWeight: 500, letterSpacing: "0.5px" }}>
            HOTEL NUEVO MILENIO
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              variant="outlined"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#38bdf8", opacity: 0.8 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <TextField
              fullWidth
              label="Contraseña"
              variant="outlined"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#38bdf8", opacity: 0.8 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            {errorMsg && (
              <Alert 
                severity="error" 
                sx={{ 
                  bgcolor: "rgba(239, 68, 68, 0.05)", 
                  color: "#fca5a5", 
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "14px",
                  alignItems: "center",
                  animation: "fadeSlideUp 0.3s ease-out forwards",
                }}
              >
                {errorMsg}
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting}
              variant="contained"
              fullWidth
              sx={{
                height: "56px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                color: "#0f172a",
                fontWeight: "800",
                fontSize: "1.05rem",
                textTransform: "none",
                letterSpacing: "0.5px",
                mt: 1, // Margen extra arriba del botón
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)",
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 25px -5px rgba(56, 189, 248, 0.5)"
                },
                "&:active": {
                  transform: "translateY(0px)",
                },
                "&:disabled": {
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "rgba(255, 255, 255, 0.3)"
                }
              }}
            >
              {submitting ? <CircularProgress size={26} sx={{ color: "#0f172a" }} /> : "Entrar al Sistema"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}

// Estilos ultra-pulidos para los Inputs
const inputStyles = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    bgcolor: "rgba(15, 23, 42, 0.5)", // Fondo interno más oscuro
    borderRadius: "14px",
    transition: "all 0.3s ease",
    "& fieldset": { 
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: "1.5px",
      transition: "all 0.3s ease",
    },
    "&:hover": {
      bgcolor: "rgba(15, 23, 42, 0.8)",
    },
    "&:hover fieldset": { 
      borderColor: "rgba(56, 189, 248, 0.4)",
    },
    "&.Mui-focused fieldset": { 
      borderColor: "#38bdf8",
      borderWidth: "2px",
    },
    // Corrección para el autofill nativo del navegador
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #0f172a inset !important", 
      WebkitTextFillColor: "white !important",                
      transition: "background-color 5000s ease-in-out 0s",    
    },
  },
  "& .MuiInputLabel-root": { 
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: 500,
  },
  "& .MuiInputLabel-root.Mui-focused": { 
    color: "#38bdf8",
    fontWeight: 600,
  },
};