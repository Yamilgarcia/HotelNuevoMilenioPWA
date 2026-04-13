import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase.config";
import { useAuth } from "../../features/auth/logic/AuthProvider";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated && profile?.role) {
      if (profile.role === "administrador") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/habitaciones", { replace: true });
      }
    }
  }, [loading, isAuthenticated, profile, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      setErrorMsg("Correo o contraseña incorrectos.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  if (!loading && isAuthenticated && profile?.role) {
    return <Navigate to={profile.role === "administrador" ? "/dashboard" : "/habitaciones"} replace />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f7fb",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "18px",
          padding: "32px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>Iniciar sesión</h1>
        <p style={{ marginTop: 0, marginBottom: "24px", color: "#64748b" }}>
          Accede al sistema del Hotel Nuevo Milenio
        </p>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label htmlFor="email" style={{ display: "block", marginBottom: "8px" }}>
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
              style={{
                width: "100%",
                height: "46px",
                borderRadius: "12px",
                border: "1px solid #dbe2ea",
                padding: "0 14px",
                fontSize: "15px",
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: "block", marginBottom: "8px" }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                height: "46px",
                borderRadius: "12px",
                border: "1px solid #dbe2ea",
                padding: "0 14px",
                fontSize: "15px",
              }}
            />
          </div>

          {errorMsg ? (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "14px",
              }}
            >
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: "48px",
              border: "none",
              borderRadius: "12px",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </main>
  );
}