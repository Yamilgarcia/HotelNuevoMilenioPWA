import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream;

    setIsIOS(ios);

    // Detectar modo standalone (Android + iOS)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (ios && window.navigator.standalone === true);

    setIsInstalled(isStandalone);

    // Capturar evento de instalación (Chrome / Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("Resultado instalación:", outcome);
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        "Para instalar en iPhone:\n\n" +
        "1. Presiona el botón Compartir\n" +
        "2. Selecciona 'Agregar a inicio'"
      );
    } else {
      alert(
        "Busca la opción 'Instalar aplicación' en el menú de tu navegador."
      );
    }
  };

  if (isInstalled) return null;

  return (
    <button
      onClick={handleClick}
      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow active:scale-[.98]"
      style={{ zIndex: 1000 }}
    >
      📲 Instalar App
    </button>
  );
}
