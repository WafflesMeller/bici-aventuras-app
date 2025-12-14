import { supabase } from './supabaseClient' // tu configuración normal
import { PSEUDO_DOMAIN } from './config'

const registerUser = async (username, password, fullName) => {
  // 1. Construimos el email falso
  const emailFalso = `${username}@${PSEUDO_DOMAIN}`;

  // 2. Registramos
  const { data, error } = await supabase.auth.signUp({
    email: emailFalso,
    password: password,
    options: {
      // Pasamos el username en la metadata para que el Trigger lo guarde
      data: {
        username: username, 
        full_name: fullName
      }
    }
  });

  if (error) {
    // Traducir error de Supabase para el usuario
    if (error.message.includes("already registered")) {
      return alert("El nombre de usuario ya existe. Intenta con otro.");
    }
    return alert("Error: " + error.message);
  }

  alert("Usuario registrado con éxito!");
};