import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase.config";

const AuthContext = createContext(null);

function normalizeRole(value) {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase();
  if (clean === "admin" || clean === "administrador") return "administrador";
  if (clean === "receptionist" || clean === "recepcionista") return "recepcionista";
  return clean;
}

// LÓGICA MODIFICADA PARA SOPORTAR OFFLINE
async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // ONLINE: Guardamos el perfil localmente por si se va el internet mañana
      localStorage.setItem(`hotel_profile_${userId}`, JSON.stringify(data));
      return data;
    }
    
    return null;
  } catch (err) {
    // OFFLINE O ERROR DE RED: Intentamos rescatar la sesión guardada
    console.warn("Sin conexión con BD, intentando cargar perfil local para mantener sesión...", err);
    
    const cachedProfile = localStorage.getItem(`hotel_profile_${userId}`);
    if (cachedProfile) {
      console.log("¡Perfil recuperado de caché local!");
      return JSON.parse(cachedProfile);
    }
    
    // Si no hay caché, no podemos dejarlo entrar porque no sabemos su rol
    return null; 
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        setLoading(true);

        // Supabase maneja esta petición usando su propia caché offline, así que no fallará sin internet
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) console.error("getSession error:", error);
        if (!mounted) return;

        setSession(session ?? null);
        setUser(session?.user ?? null);

        if (session?.user?.id) {
          const profileData = await getProfile(session.user.id);
          if (!mounted) return;

          const normalizedRole = normalizeRole(profileData?.role);

          setProfile({
            ...profileData,
            role: normalizedRole,
          });
          setRole(normalizedRole);
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Error inicializando auth:", err);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        try {
          if (!mounted) return;

          setLoading(true);
          setSession(newSession ?? null);
          setUser(newSession?.user ?? null);

          if (newSession?.user?.id) {
            const profileData = await getProfile(newSession.user.id);
            if (!mounted) return;

            const normalizedRole = normalizeRole(profileData?.role);

            setProfile({
              ...profileData,
              role: normalizedRole,
            });
            setRole(normalizedRole);
          } else {
            setProfile(null);
            setRole(null);
          }
        } catch (err) {
          console.error("onAuthStateChange error:", err);
          if (!mounted) return;
          setProfile(null);
          setRole(null);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Limpiamos la caché del perfil al cerrar sesión manualmente
    if (user?.id) localStorage.removeItem(`hotel_profile_${user.id}`);

    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      loading,
      isAuthenticated: !!user,
      isAdmin: role === "administrador",
      isReceptionist: role === "recepcionista",
      signIn,
      signOut,
    }),
    [session, user, profile, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}