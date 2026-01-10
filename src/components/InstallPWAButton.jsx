import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, Typography, Box } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddToHomeScreenIcon from "@mui/icons-material/AddToHomeScreen"; // Si no existe, usa un icono genérico o texto

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [openIOSHelp, setOpenIOSHelp] = useState(false);

  useEffect(() => {
    // 1. Detectar si YA está instalada (Modo Standalone)
    const isInStandaloneMode = () => 
      ('standalone' in window.navigator) && (window.navigator.standalone) || 
      (window.matchMedia('(display-mode: standalone)').matches);

    if (isInStandaloneMode()) {
      setIsInstalled(true);
    }

    // 2. Detectar si es iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Capturar el evento de Chrome/Android (si ocurre)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // OJO: No usamos esto para mostrar/ocultar el botón, solo guardamos el evento
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Escuchar si se instaló exitosamente
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // CASO A: Tenemos el evento automático (Android/Chrome Desktop)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } 
    // CASO B: Es iOS (iPhone no permite instalación automática)
    else if (isIOS) {
      setOpenIOSHelp(true);
    } 
    // CASO C: No hay evento ni es iOS (probablemente bloqueado o navegador no compatible)
    else {
      alert("Para instalar, busca la opción 'Instalar aplicación' o 'Agregar a inicio' en el menú de tu navegador.");
    }
  };

  // Si ya está instalada, no renderizamos nada
  if (isInstalled) return null;

  return (
    <>
      {/* Botón Siempre Visible (mientras no esté instalada) */}
      <button
        onClick={handleInstallClick}
        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow active:scale-[.98] transition-all"
      >
        📲 Instalar App
      </button>

      {/* Modal de Ayuda para iPhone (Solo se abre si es iOS y dan click) */}
      <Dialog open={openIOSHelp} onClose={() => setOpenIOSHelp(false)}>
        <DialogTitle>Instalar en iPhone</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            iOS no permite instalación automática. Sigue estos pasos:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IosShareIcon sx={{ mr: 1 }} /> 
            <Typography variant="body2">1. Toca el botón <b>Compartir</b> en la barra inferior.</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddToHomeScreenIcon sx={{ mr: 1 }} />
            <Typography variant="body2">2. Busca y selecciona <b>"Agregar a Inicio"</b>.</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}