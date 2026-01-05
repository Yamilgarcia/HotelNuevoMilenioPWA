import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BedIcon from '@mui/icons-material/Bed';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import { Link } from 'react-router-dom';

const drawerWidth = 280; // Un poco más ancho para mejor legibilidad

export default function SideMenu({ open, onClose }) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose} // Esto permite cerrar al tocar fuera o presionar Esc
      sx={{
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box', 
          bgcolor: '#1e293b', 
          color: 'white',
          borderRight: '1px solid rgba(255,255,255,0.1)'
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#38bdf8' }}>
            HOTEL
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.7, letterSpacing: 1 }}>
            NUEVO MILENIO
          </Typography>
        </Toolbar>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        
        <List sx={{ px: 2 }}>
          {[
            { text: 'Panel de Control', icon: <DashboardIcon />, path: '/' },
            { text: 'Registrar Habitación', icon: <AppRegistrationIcon />, path: '/RegistrarHabitacion' },
            { text: 'Apertura (Hab)', icon: <BedIcon />, path: '/apertura' },
            { text: 'Gastos', icon: <AccountBalanceWalletIcon />, path: '/gastos' },
            { text: 'Historial', icon: <PeopleIcon />, path: '/historial' },
          ].map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                component={Link} 
                to={item.path} 
                onClick={onClose} // Cierra el menú al navegar
                sx={{ 
                  borderRadius: '12px',
                  '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' }
                }}
              >
                <ListItemIcon sx={{ color: '#38bdf8', minWidth: 45 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
          <ListItemButton 
            component={Link} 
            to="/config" 
            onClick={onClose}
            sx={{ borderRadius: '12px' }}
          >
            <ListItemIcon sx={{ color: 'white', opacity: 0.7 }}><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Configuración" />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
}