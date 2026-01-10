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
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/gohan.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      <Box
        sx={{
          relative: true,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Header con AppBar para mejor estructura */}
        <AppBar
          position="sticky"
          sx={{
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            color: "#1e293b",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={() => setMenuOpen(true)}
                sx={{ mr: 2, color: "#1e293b" }}
                size="large" // Botón más grande
              >
                <MenuIcon fontSize="large" />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: -0.5 }}
              >
                HOTEL NUEVO MILENIO
              </Typography>
            </Box>

            <InstallPWAButton />
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, md: 4 }, flexGrow: 1 }}>
          <Outlet />
        </Box>

        {/* Menú lateral con estados */}
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </Box>
    </Box>
  );
}
