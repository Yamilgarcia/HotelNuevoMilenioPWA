import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Chip,
  Collapse,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/logic/AuthProvider";
import { logAuditEvent } from "../utils/auditClient";

const drawerWidth = 280;

export default function SideMenu({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();

  const [openSettings, setOpenSettings] = useState(false);
  const [openReportes, setOpenReportes] = useState(false);

  const currentRole = (role || profile?.role || "").toLowerCase();

  const menuItems = [
    {
      text: "Panel de Control",
      icon: <DashboardIcon />,
      path: "/",
      roles: ["administrador", "recepcionista"],
    },
    {
      text: "Usuarios",
      icon: <GroupIcon />,
      path: "/usuarios",
      roles: ["administrador"],
    },
    {
      text: "Auditoría",
      icon: <ManageSearchIcon />,
      path: "/auditoria",
      roles: ["administrador"],
    },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  async function handleLogout() {
    await logAuditEvent({
      action: "LOGOUT",
      entityTable: "profiles",
      entityId: profile?.id || profile?.email || null,
      metadata: {
        modulo: "auth",
        descripcion: "Usuario cerró sesión",
        email: profile?.email || null,
        nombre: profile?.nombre || null,
        role: currentRole || null,
      },
    });

    await signOut();
    onClose?.();
    navigate("/login", { replace: true });
  }

  const handleSettingsClick = () => {
    setOpenSettings((prev) => !prev);
  };

  const handleReportesClick = () => {
    setOpenReportes((prev) => !prev);
  };

  const roleLabel =
    currentRole === "administrador"
      ? "Administrador"
      : currentRole === "recepcionista"
        ? "Recepcionista"
        : "Sin rol";

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "#1e293b",
          color: "white",
          borderRight: "1px solid rgba(255,255,255,0.1)",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Toolbar
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            py: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#38bdf8" }}>
            HOTEL
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ opacity: 0.7, letterSpacing: 1, mb: 1.5 }}
          >
            NUEVO MILENIO
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {profile?.nombre || profile?.email || "Usuario"}
          </Typography>

          <Chip
            label={roleLabel}
            size="small"
            sx={{
              mt: 1,
              bgcolor: currentRole === "administrador" ? "#0f172a" : "#075985",
              color: "#fff",
              fontWeight: 600,
            }}
          />
        </Toolbar>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 1 }} />

        <List sx={{ px: 2 }}>
          {visibleItems.map((item) => {
            const selected =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={onClose}
                  selected={selected}
                  sx={{
                    borderRadius: "12px",
                    bgcolor: selected
                      ? "rgba(56, 189, 248, 0.16)"
                      : "transparent",
                    "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                    "&.Mui-selected": {
                      bgcolor: "rgba(56, 189, 248, 0.16)",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(56, 189, 248, 0.22)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "#38bdf8", minWidth: 45 }}>
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {currentRole === "administrador" && (
            <>
              <ListItemButton
                onClick={handleReportesClick}
                sx={{
                  borderRadius: "12px",
                  mb: openReportes ? 0.5 : 0.5,
                  color: "white",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <ListItemIcon sx={{ color: "#38bdf8", minWidth: 45 }}>
                  <AssessmentIcon />
                </ListItemIcon>

                <ListItemText
                  primary="Reportes"
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                />

                {openReportes ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={openReportes} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton
                    component={Link}
                    to="/Recepcion/ReporteClientesFieles"
                    onClick={onClose}
                    selected={
                      location.pathname === "/Recepcion/ReporteClientesFieles"
                    }
                    sx={{
                      borderRadius: "12px",
                      pl: 4,
                      mb: 1,
                      bgcolor:
                        location.pathname === "/Recepcion/ReporteClientesFieles"
                          ? "rgba(56, 189, 248, 0.16)"
                          : "transparent",
                      "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#38bdf8", minWidth: 45 }}>
                      <WorkspacePremiumIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText
                      primary="Clientes Fieles"
                      primaryTypographyProps={{ fontSize: "0.9rem" }}
                    />
                  </ListItemButton>

                  <ListItemButton
                    component={Link}
                    to="/Recepcion/ReporteTemporadasAltas"
                    onClick={onClose}
                    selected={
                      location.pathname === "/Recepcion/ReporteTemporadasAltas"
                    }
                    sx={{
                      borderRadius: "12px",
                      pl: 4,
                      mb: 1,
                      bgcolor:
                        location.pathname ===
                        "/Recepcion/ReporteTemporadasAltas"
                          ? "rgba(56, 189, 248, 0.16)"
                          : "transparent",
                      "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#38bdf8", minWidth: 45 }}>
                      <InsertChartIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText
                      primary="Temporadas Altas"
                      primaryTypographyProps={{ fontSize: "0.9rem" }}
                    />
                  </ListItemButton>
                </List>
              </Collapse>
            </>
          )}
        </List>

        <Box sx={{ mt: "auto", p: 2 }}>
          <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }} />

          {currentRole === "administrador" && (
            <>
              <ListItemButton
                onClick={handleSettingsClick}
                sx={{
                  borderRadius: "12px",
                  mb: openSettings ? 0.5 : 1,
                  color: "white",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <ListItemIcon sx={{ color: "white", opacity: 0.7 }}>
                  <SettingsIcon />
                </ListItemIcon>

                <ListItemText primary="Configuración" />

                {openSettings ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={openSettings} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton
                    component={Link}
                    to="/configuracion/habitaciones"
                    onClick={onClose}
                    selected={
                      location.pathname === "/configuracion/habitaciones"
                    }
                    sx={{
                      borderRadius: "12px",
                      pl: 4,
                      mb: 1,
                      bgcolor:
                        location.pathname === "/configuracion/habitaciones"
                          ? "rgba(56, 189, 248, 0.16)"
                          : "transparent",
                      "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#38bdf8", minWidth: 45 }}>
                      <AppRegistrationIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText
                      primary="Panel Habitaciones"
                      primaryTypographyProps={{ fontSize: "0.9rem" }}
                    />
                  </ListItemButton>
                </List>
              </Collapse>
            </>
          )}

          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: "12px",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.14)" },
            }}
          >
            <ListItemIcon sx={{ color: "#f87171" }}>
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
}