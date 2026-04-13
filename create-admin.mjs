import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const email = "mr5405750@gmail.com";
const password = "Admin12345!";

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { nombre: "Marcel" },
});

if (error) {
  console.error("Error creando usuario:", error.message);
  process.exit(1);
}

const userId = data.user.id;

const { error: profileError } = await supabase
  .from("profiles")
  .upsert({
    id: userId,
    email,
    nombre: "Marcel",
    role: "administrador",
  });

if (profileError) {
  console.error("Usuario creado, pero falló profiles:", profileError.message);
  process.exit(1);
}

console.log("Admin creado.");
console.log("Correo:", email);
console.log("Contraseña:", password);