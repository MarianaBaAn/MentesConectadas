// Sesión didáctica (igual que la plantilla del profe): se guarda en sessionStorage.
const SESSION_KEY = "mentes_conectadas_usuario";

function obtenerUsuario() {
  const valor = sessionStorage.getItem(SESSION_KEY);
  try {
    return valor ? JSON.parse(valor) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// Devuelve true si hay sesión; si no, manda al login.
function protegerPagina() {
  if (!obtenerUsuario()) { window.location.replace("login.html"); return false; }
  return true;
}
