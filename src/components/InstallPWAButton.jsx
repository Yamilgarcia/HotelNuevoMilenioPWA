import { useEffect, useState } from "react";
import { Button } from "@mui/material"; // Usamos MUI para que combine con tu AppBar

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Escuchamos el evento nativo de Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Evitamos que Chrome muestre su banner feo abajo
      setDeferredPrompt(e);
      setReady(true); // ¡Bingo! Chrome dice que se puede instalar, mostramos botón
    };

    // 2. Si el usuario instala, ocultamos el botón
    const handleAppInstalled = () => {
      setInstalled(true);
      setReady(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (!deferredPrompt) return;

    // Lanzamos el popup nativo del sistema
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log("Resultado:", outcome);

    setDeferredPrompt(null);
    setReady(false); // Ocultamos el botón inmediatamente después del click

    if (outcome === "accepted") {
      setInstalled(true);
    }
  };

  // Lógica de Mandaditos: Si ya está instalada O NO está lista, NO RENDERIZAR NADA
  if (installed || !ready) {
    return null;
  }

  return (
    <Button 
      onClick={handleClick} 
      variant="contained" 
      color="success"
      sx={{ 
        textTransform: 'none', 
        fontWeight: 'bold',
        boxShadow: 2 
      }}
    >
      📲 Instalar App
    </Button>
  );
}