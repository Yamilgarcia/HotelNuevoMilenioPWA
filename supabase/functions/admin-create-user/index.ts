import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(
        { error: "Faltan variables de entorno en la función." },
        500
      );
    }

    if (!authHeader) {
      return jsonResponse({ error: "No autorizado." }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Sesión inválida." }, 401);
    }

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from("profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .single();

    if (
      adminProfileError ||
      !adminProfile ||
      adminProfile.role !== "administrador" ||
      adminProfile.status === "inactivo"
    ) {
      return jsonResponse(
        { error: "No tienes permisos para crear usuarios." },
        403
      );
    }

    const payload = await req.json();

    const email = normalizeText(payload?.email)?.toLowerCase();
    const password = normalizeText(payload?.password);
    const nombre = normalizeText(payload?.nombre);
    const username = normalizeText(payload?.username);
    const phone = normalizeText(payload?.phone);
    const address = normalizeText(payload?.address);
    const birth_date = normalizeText(payload?.birth_date);
    const cargo = normalizeText(payload?.cargo);
    const role = normalizeText(payload?.role) || "recepcionista";
    const status = normalizeText(payload?.status) || "activo";
    const avatar_url = normalizeText(payload?.avatar_url);

    if (!email) {
      return jsonResponse({ error: "El correo es obligatorio." }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "El correo no es válido." }, 400);
    }

    if (!password || password.length < 8) {
      return jsonResponse(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        400
      );
    }

    if (!nombre) {
      return jsonResponse({ error: "El nombre es obligatorio." }, 400);
    }

    if (!["administrador", "recepcionista"].includes(role)) {
      return jsonResponse({ error: "El rol no es válido." }, 400);
    }

    if (!["activo", "inactivo"].includes(status)) {
      return jsonResponse({ error: "El estado no es válido." }, 400);
    }

    const { data: createdUserData, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
        },
      });

    if (createUserError) {
      return jsonResponse(
        { error: createUserError.message || "No se pudo crear el usuario." },
        400
      );
    }

    const authUserId = createdUserData.user?.id;

    if (!authUserId) {
      return jsonResponse(
        { error: "No se pudo obtener el id del usuario creado." },
        500
      );
    }

    const profilePayload = {
      id: authUserId,
      email,
      nombre,
      username,
      phone,
      address,
      birth_date,
      cargo,
      role,
      status,
      avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select(
        "id, email, nombre, username, phone, address, birth_date, cargo, role, status, avatar_url, created_at, updated_at"
      )
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authUserId);
      return jsonResponse(
        { error: profileError.message || "No se pudo guardar el perfil." },
        400
      );
    }

    return jsonResponse(
      {
        message: "Usuario creado correctamente.",
        profile,
      },
      200
    );
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al crear el usuario.",
      },
      500
    );
  }
});