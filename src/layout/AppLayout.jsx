import { useState } from "react";
import { Outlet } from "react-router-dom";
import { IconButton, Box, AppBar, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SideMenu from "../components/SideMenu";
import InstallPWAButton from "../components/InstallPWAButton";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box
      
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* APPBAR MODERNA Y OSCURA */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(30, 41, 59, 0.8)", // Tono oscuro a juego con los reportes
            backdropFilter: "blur(12px)", // Efecto cristal oscuro
            color: "#f8fafc", // Texto blanco tiza
            borderBottom: "1px solid rgba(255,255,255,0.08)", // Línea separadora sutil
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", gap: 2, py: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
              <IconButton
                onClick={() => setMenuOpen(true)}
                sx={{ 
                  mr: 2, 
                  color: "#38bdf8", // Acento celeste
                  bgcolor: "rgba(56, 189, 248, 0.1)", // Fondo translúcido
                  transition: "all 0.2s",
                  '&:hover': { bgcolor: "rgba(56, 189, 248, 0.2)" }
                }}
                size="medium"
              >
                <MenuIcon />
              </IconButton>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <Box component="span" sx={{ color: "#38bdf8" }}>HOTEL</Box> NUEVO MILENIO
              </Typography>
            </Box>

            <InstallPWAButton />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            // Le regresamos un margen (p: 1 en celulares) para que actúe como muro de contención
            p: { xs: 1, md: 4 }, 
            flexGrow: 1,
            // Limitamos su ancho al 100% para que la tabla no lo empuje
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <Outlet />
        </Box>

        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </Box>
    </Box>
  );
}