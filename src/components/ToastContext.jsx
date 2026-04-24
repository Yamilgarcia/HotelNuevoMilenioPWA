import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // Eliminarlo después de 3 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ESTILOS DE ANIMACIÓN INYECTADOS */}
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes shrinkProgressBar {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>

      {/* CONTENEDOR FLOTANTE */}
      <div 
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// COMPONENTE VISUAL PREMIUM
function ToastBubble({ message, type }) {
  // Paleta de colores vibrantes para Modo Oscuro
  const stylesByType = {
    success: { 
      borderColor: "#10b981", // Verde esmeralda
      icon: "✔️", 
      iconBg: "rgba(16, 185, 129, 0.2)"
    },
    error: { 
      borderColor: "#ef4444", // Rojo vibrante
      icon: "✖️", 
      iconBg: "rgba(239, 68, 68, 0.2)"
    },
    info: { 
      borderColor: "#38bdf8", // Azul de tu App
      icon: "ℹ️", 
      iconBg: "rgba(56, 189, 248, 0.2)"
    },
  };

  const currentStyle = stylesByType[type] || stylesByType.info;

  return (
    <div 
      style={{
        position: "relative",
        minWidth: "280px",
        maxWidth: "350px",
        backgroundColor: "#1e293b", // Fondo oscuro a juego con tu SideMenu
        color: "#ffffff",
        borderRadius: "10px",
        overflow: "hidden", // Para que la barra de progreso no se salga
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px",
        borderLeft: `6px solid ${currentStyle.borderColor}`, // Borde lateral grueso
        animation: "slideInRight 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards",
      }}
    >
      {/* Icono redondeado */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minWidth: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: currentStyle.iconBg,
        fontSize: "14px",
      }}>
        {currentStyle.icon}
      </div>

      {/* Texto del mensaje */}
      <span style={{ 
        fontSize: "0.95rem", 
        fontWeight: 500, 
        lineHeight: 1.4,
        letterSpacing: "0.3px"
      }}>
        {message}
      </span>

      {/* Barra de progreso animada (3 segundos) */}
      <div 
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "4px",
          backgroundColor: currentStyle.borderColor,
          animation: "shrinkProgressBar 3s linear forwards",
        }}
      />
    </div>
  );
}