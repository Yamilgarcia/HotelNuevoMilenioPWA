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
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        position: "relative",
      }}
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
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            color: "#1e293b",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
              <IconButton
                onClick={() => setMenuOpen(true)}
                sx={{ mr: 2, color: "#1e293b" }}
                size="large"
              >
                <MenuIcon fontSize="large" />
              </IconButton>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                HOTEL NUEVO MILENIO
              </Typography>
            </Box>

            <InstallPWAButton />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            p: { xs: 2, md: 4 },
            flexGrow: 1,
          }}
        >
          <Outlet />
        </Box>

        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </Box>
    </Box>
  );
}